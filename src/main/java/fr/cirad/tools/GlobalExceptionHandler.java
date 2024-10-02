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
package fr.cirad.tools;

import java.util.HashMap;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.collections.map.UnmodifiableMap;
import org.apache.commons.lang.exception.ExceptionUtils;
import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.handler.SimpleMappingExceptionResolver;
import org.springframework.web.servlet.view.json.MappingJackson2JsonView;

import fr.cirad.tools.security.base.AbstractTokenManager;

@ControllerAdvice
public class GlobalExceptionHandler {

	protected static final Logger LOG = Logger.getLogger(GlobalExceptionHandler.class);
	
	@Autowired private SimpleMappingExceptionResolver exceptionResolver;
	@Autowired private AbstractTokenManager tokenManager;
	
  @ExceptionHandler(Exception.class)
  public ModelAndView handleAllExceptions(HttpServletRequest request, HttpServletResponse response, Exception ex)
  {
	  	if (ex instanceof HttpRequestMethodNotSupportedException)
	  		LOG.error("Error at URL (" + ex.hashCode() + ") " + request.getRequestURI() + "?" + request.getQueryString() + " - " + ex.getMessage());
	  	else {
	  		LOG.error("Error at URL (" + ex.hashCode() + ") " + request.getRequestURI() + "?" + request.getQueryString(), ex);
	  	}

  		if (AccessDeniedException.class.isAssignableFrom(ex.getClass()))
  			response.setStatus(HttpServletResponse.SC_FORBIDDEN);
  		else
  			response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);

	  	if ("XMLHttpRequest".equals(request.getHeader("X-Requested-With")))
		{
			HashMap<String, String> map = new HashMap<String, String>();
			map.put("errorMsg", ExceptionUtils.getStackTrace(ex));
			return new ModelAndView(new MappingJackson2JsonView(), UnmodifiableMap.decorate(map));
		}
		else
			return exceptionResolver.resolveException(request, response, null, ex);
  }
  
  @ExceptionHandler(MaxUploadSizeExceededException.class)
  public ModelAndView handleMaxUploadSizeExceededException(HttpServletRequest request, HttpServletResponse response, MaxUploadSizeExceededException ex)
  {		// try and handle MaxUploadSizeExceededException gracefully
		String token = tokenManager.readToken(request);
		if (token != null)
		{
  			ProgressIndicator progress = new ProgressIndicator(token, new String[0]);
  			progress.setError(ex.getMessage());
  			ProgressIndicator.registerProgressIndicator(progress);
  			LOG.debug("ProgressIndicator marked as failed for token " + token);
		}
		return handleAllExceptions(request, response, ex);
  }
}