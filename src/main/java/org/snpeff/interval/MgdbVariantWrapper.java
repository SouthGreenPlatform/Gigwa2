package org.snpeff.interval;

import org.snpeff.snpEffect.VariantEffect;

import fr.cirad.mgdb.model.mongo.maintypes.DBVCFHeader;
import fr.cirad.mgdb.model.mongo.maintypes.VariantRunData;

public class MgdbVariantWrapper extends Variant {
	private static final long serialVersionUID = 4989761070007311042L;
	
	private VariantRunData wrappedVariant;
	private DBVCFHeader headerData;
	
	public MgdbVariantWrapper(VariantRunData vrd, DBVCFHeader header) {
		wrappedVariant = vrd;
		headerData = header;
	}
	
	public void addEffect(VariantEffect effect) {
		// TODO
	}
}
