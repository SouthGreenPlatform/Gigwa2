package fr.cirad.tools;

import java.util.Arrays;
import java.util.Collection;

import org.springframework.stereotype.Component;

import fr.cirad.tools.AbstractConfigManager;

@Component
public class GigwaConfigManager extends AbstractConfigManager {

	@Override
	public String getPropertyOverridingPrefix() {
		return "GIGWA.";
	}

	@Override
	public Collection<String> getNonOverridablePropertyNames() {
		return Arrays.asList("casServerURL");
	}

}