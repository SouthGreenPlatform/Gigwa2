package org.snpeff.snpEffect.commandLine;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.snpeff.interval.Chromosome;
import org.snpeff.interval.Genome;
import org.snpeff.interval.MgdbVariantWrapper;
import org.snpeff.snpEffect.Config;
import org.snpeff.snpEffect.SnpEffectPredictor;
import org.snpeff.snpEffect.VariantEffect;
import org.snpeff.snpEffect.VariantEffect.EffectImpact;
import org.snpeff.snpEffect.VariantEffects;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import com.mongodb.BasicDBObject;

import fr.cirad.mgdb.model.mongo.maintypes.DBVCFHeader;
import fr.cirad.mgdb.model.mongo.maintypes.VariantRunData;
import fr.cirad.tools.mongo.MongoTemplateManager;


public class SnpEffService {
	public static String annotateProject(String module, int project, String snpEffDatabase) {
		MongoTemplate template = MongoTemplateManager.get(module);

		Config config = new Config(snpEffDatabase, "/home/u017-h433/Documents/deps/snpEff/snpEff.config", "/home/u017-h433/Documents/deps/snpEff/data", null);
		Genome genome = config.getGenome();
		SnpEffectPredictor predictor = config.loadSnpEffectPredictor();
		predictor.buildForest();
		System.out.println("Loaded genome " + genome.getGenomeId());

		//BasicDBObject queryVarAnn = new BasicDBObject();
        //queryVarAnn.put("_id." + DBVCFHeader.VcfHeaderId.FIELDNAME_PROJECT, project);
        //DBVCFHeader headerData = DBVCFHeader.fromDocument(MongoTemplateManager.get(module).getCollection(MongoTemplateManager.getMongoCollectionName(DBVCFHeader.class)).find(queryVarAnn).first());

		Query vrdQuery = new Query();
		vrdQuery.addCriteria(Criteria.where("_id." + VariantRunData.VariantRunDataId.FIELDNAME_PROJECT_ID).is(project));
		List<VariantRunData> variantRunData = template.find(vrdQuery, VariantRunData.class);

		for (VariantRunData vrd : variantRunData) {
			Chromosome chromosome = getParentChromosome(vrd, genome);
			System.out.println(chromosome.getChromosomeName() + " - " + vrd.getVariantId());
			MgdbVariantWrapper variant = new MgdbVariantWrapper(chromosome, vrd, null);
			annotateVariant(variant, predictor);
		}

		return null;
	}

	private static boolean annotateVariant(MgdbVariantWrapper variant, SnpEffectPredictor predictor) {
		// Calculate effects: By default do not annotate non-variant sites
		if (!variant.isVariant()) return false;

		boolean impactModerateOrHigh = false; // Does this entry have a 'MODERATE' or 'HIGH' impact?
		boolean impactLowOrHigher = false; // Does this entry have an impact (other than MODIFIER)?

		VariantEffects variantEffects = predictor.variantEffect(variant);

		// Show results
		for (VariantEffect variantEffect : variantEffects) {
			/*if (variantEffect.hasError()) errByType.inc(variantEffect.getError());
			if (variantEffect.hasWarning()) warnByType.inc(variantEffect.getWarning());*/

			// Does this entry have an impact (other than MODIFIER)?
			impactLowOrHigher |= (variantEffect.getEffectImpact() != EffectImpact.MODIFIER);
			impactModerateOrHigh |= (variantEffect.getEffectImpact() == EffectImpact.MODERATE) || (variantEffect.getEffectImpact() == EffectImpact.HIGH);
			variant.addEffect(variantEffect);
		}
		System.out.println(impactLowOrHigher + " " + impactModerateOrHigh);

		return impactLowOrHigher;
	}

	public static Chromosome getParentChromosome(VariantRunData vrd, Genome genome) {
		String sequence = vrd.getReferencePosition().getSequence();
		Chromosome chromosome = genome.getChromosome(sequence);
		if (chromosome != null) return chromosome;

		// Isolate the numeric part
		Pattern singleNumericPattern = Pattern.compile("\\D*(\\d+)\\D*");
		Matcher matcher = singleNumericPattern.matcher(sequence);
		matcher.find();
		if (matcher.matches()) {
			chromosome = genome.getChromosome(matcher.group(1));
			if (chromosome != null) return chromosome;
		}

		throw new RuntimeException("Chromosome name " + sequence + " is not compatible with the SnpEff database");
	}
}
