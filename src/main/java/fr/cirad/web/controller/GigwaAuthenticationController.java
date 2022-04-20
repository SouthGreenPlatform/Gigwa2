package fr.cirad.web.controller;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.web.savedrequest.SavedRequest;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import fr.cirad.security.GigwaAuthenticationSuccessHandler;

@Controller
@CrossOrigin
public class GigwaAuthenticationController {
	private static final String LOGIN_CAS_URL = "/login/cas.do";
	private static final String LOGIN_FORM_URL = "/login.do";

	@Autowired GigwaAuthenticationSuccessHandler authenticationSuccessHandler;

	@GetMapping(LOGIN_FORM_URL)
	public String loginFormPath(HttpServletRequest request, HttpServletResponse response) {
		SavedRequest savedRequest = authenticationSuccessHandler.getRequestCache().getRequest(request, response);
		if (savedRequest != null) {
			String targetUrl = savedRequest.getRedirectUrl();
			try {
				String redirectUrl = URLEncoder.encode(targetUrl, StandardCharsets.UTF_8.name());
				request.setAttribute("loginOrigin", redirectUrl);
			} catch (UnsupportedEncodingException ignored) {}
			//authenticationSuccessHandler.getRequestCache().removeRequest(request, response);
		}

		return "login";
	}

	@GetMapping(LOGIN_CAS_URL)
	public String casLoginPath(@RequestParam(name="url", required=false) String redirectUrl) {
		if (redirectUrl != null && !"".equals(redirectUrl.trim())) {
			try {
				return "redirect:" + URLDecoder.decode(redirectUrl, StandardCharsets.UTF_8.name());
			} catch (UnsupportedEncodingException exc) {
				return "redirect:/index.jsp";
			}
		} else {
			return "redirect:/index.jsp";
		}
	}
}
