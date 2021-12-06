package fr.cirad.web.controller;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class GigwaAuthenticationController {
	private static final String LOGIN_CAS_URL = "/login/cas.do";
	
	@GetMapping(LOGIN_CAS_URL)
	public String casLoginPath(HttpServletRequest request, HttpServletResponse resp) {
		return "redirect:/index.jsp";
	}
}
