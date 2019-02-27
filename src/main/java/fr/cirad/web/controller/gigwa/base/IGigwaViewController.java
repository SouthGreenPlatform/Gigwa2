/*******************************************************************************
 * GIGWA - Genotype Investigator for Genome Wide Analyses
 * Copyright (C) 2016 - 2019, <CIRAD> <IRD>
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License, version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * See <http://www.gnu.org/licenses/agpl.html> for details about GNU General
 * Public License V3.
 *******************************************************************************/
package fr.cirad.web.controller.gigwa.base;

/**
 * The Interface IGigwaViewController.
 */
public interface IGigwaViewController
{
	
	/**
	 * Gets the view description.
	 *
	 * @return the view description
	 */
	abstract public String getViewDescription();
	
	/**
	 * Gets the view url.
	 *
	 * @return the view url
	 */
	abstract public String getViewURL();
}
