package org.snpeff.interval;

import org.snpeff.snpEffect.VariantEffect;

import fr.cirad.mgdb.model.mongo.maintypes.DBVCFHeader;
import fr.cirad.mgdb.model.mongo.maintypes.VariantRunData;


/**
 * Implementation of org.snpEff.interval.Variant's interface around an Mgdb2 variant
 * @author Grégori MIGNEROT
 * @implNote As this makes use of undocumented code that is not supposed to be used as a library, this deliberately contains lots of internal encapsulation to minimize the effort to keep it up to date, even if it harms performance a little bit
 */
public class MgdbVariantWrapper extends Variant {
	private static final long serialVersionUID = 4989761070007311042L;

	private VariantRunData variant;
	private DBVCFHeader header;

	public MgdbVariantWrapper(Marker parent, VariantRunData vrd, DBVCFHeader header) {
		super(parent,
				(int)vrd.getReferencePosition().getStartSite(),
				vrd.getKnownAlleleList().get(0),
				String.join(",", vrd.getKnownAlleleList().subList(1, vrd.getKnownAlleleList().size())),
				vrd.getId().getVariantId());

		this.variant = vrd;
		this.header = header;
	}

	public void addEffect(VariantEffect effect) {
		System.out.println(effect.toString());
	}

	/*//////// org.snpeff.interval.Interval

	@Override
	public MgdbVariantWrapper clone() {
		return (MgdbVariantWrapper) super.clone();
	}

	@Override
	public int compareTo(Interval i2) {
		if (this.getStart() > i2.getStart()) return 1;
		if (this.getStart() < i2.getStart()) return -1;

		if (this.getEnd() < i2.getEnd()) return 1;
		if (this.getEnd() > i2.getEnd()) return -1;

		return 0;
	}

	@Override
	public boolean equals(Interval interval) {
		return compareTo(interval) == 0;
	}

	@Override
	public int getEnd() {
		return variant.getReferencePosition().getEndSite().intValue();
	}

	@Override
	public void setEnd(int end) {
		variant.getReferencePosition().setEndSite((long)end);
	}

	@Override
	public String getId() {
		return variant.getId().getVariantId();
	}

	@Override
	public void setId(String id) {
		variant.getId().setVariantId(id);
	}

	@Override
	public int getStart() {
		return (int)variant.getReferencePosition().getStartSite();
	}

	@Override
	public void setStart(int start) {
		variant.getReferencePosition().setStartSite((long)start);
	}

	@Override
	public int hashCode() {
		int hashCode = getChromosomeName().hashCode();
		hashCode = hashCode * 31 + getStart();
		hashCode = hashCode * 31 + getEnd();
		hashCode = hashCode * 31 + 1;
		if (getId() != null) hashCode = hashCode * 31 + id.hashCode();
		return hashCode;
	}

	public boolean intersects(int start, int end) {
		return (end >= getStart() && start <= getEnd());
	}

	public boolean intersects(long point) {
		return (getStart() <= point && point <= end);
	}

	public boolean intersects(Marker interval) {
		if (!interval.getChromosomeName().equals(this.getChromosomeName()))
			return false;
		else
			return intersects(interval.getStart(), interval.getEnd());
	}

	public int intersectSize(Marker interval) {
		if (!interval.getChromosomeName().equals(this.getChromosomeName()))
			return 0;

		int start = Math.max(this.getStart(), interval.getStart());
		int end = Math.min(this.getEnd(), interval.getEnd());

		if (end < start) return 0;
		return (end - start) + 1;
	}

	public boolean isCircular() {
		Chromosome chr = getChromosome();
		return getStart() < 0 || (getStart() > getEnd()) || (end > chr.getEnd());
	}

	public boolean isValid() {
		return getStart() <= getEnd();
	}

	public void shiftCoordinates(int shift) {
		setStart(getStart() + shift);
		setEnd(getEnd() + shift);
	}

	public int size() {
		return getEnd() - getStart() + 1;
	}

	public String toStr() {
		return getClass().getSimpleName() + "_" + getChromosomeName() + ":" + (getStart() + 1) + "-" + (getEnd() + 1);
	}

	public String toStringAsciiArt(int maxLen) {
		StringBuilder sb = new StringBuilder();
		for (int i = 0; i < maxLen; i++) {
			if (i >= getStart() && i <= getEnd())
				sb.append("-");
			else
				sb.append(" ");
		}
		return sb.toString();
	}

	public String toStrPos() {
		return getChromosomeName() + ":" + (getStart() + 1) + "-" + (getEnd() + 1);
	}

	//////// org.snpeff.interval.Marker

	protected void adjust(Marker child) {
		this.setStart(Math.min(this.getStart(), child.getStart()));
		this.setEnd(Math.max(this.getEnd(), child.getEnd()));
	}

	protected Marker applyDel(Variant variant) {
		Marker m = this.cloneShallow();
		if (variant.getEnd() < m.getStart()) {
			m.setStart(m.getStart() + variant.lengthChange());
			m.setEnd(m.getEnd() + variant.lengthChange());
		}
	}*/


}
