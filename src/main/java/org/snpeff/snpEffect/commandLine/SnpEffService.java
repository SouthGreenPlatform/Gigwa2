package org.snpeff.snpEffect.commandLine;

import java.util.List;

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
		SnpEffectPredictor predictor = SnpEffectPredictor.load(config);
		
		BasicDBObject queryVarAnn = new BasicDBObject();
        queryVarAnn.put("_id." + DBVCFHeader.VcfHeaderId.FIELDNAME_PROJECT, project);
        DBVCFHeader headerData = DBVCFHeader.fromDocument(MongoTemplateManager.get(module).getCollection(MongoTemplateManager.getMongoCollectionName(DBVCFHeader.class)).find(queryVarAnn).first());
		
		Query vrdQuery = new Query();
		vrdQuery.addCriteria(Criteria.where("_id." + VariantRunData.VariantRunDataId.FIELDNAME_PROJECT_ID).is(project));
		List<VariantRunData> variantRunData = template.find(vrdQuery, VariantRunData.class);
		
		for (VariantRunData vrd : variantRunData) {
			System.out.println(vrd.getVariantId());
			MgdbVariantWrapper variant = new MgdbVariantWrapper(vrd, headerData);
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
}
