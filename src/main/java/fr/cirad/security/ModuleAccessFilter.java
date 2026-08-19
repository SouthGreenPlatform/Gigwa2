//package fr.cirad.security;
//
//import java.io.IOException;
//import java.util.Collection;
//import java.util.Map;
//
//import jakarta.servlet.FilterChain;
//import jakarta.servlet.ServletException;
//import jakarta.servlet.http.HttpServletRequest;
//import jakarta.servlet.http.HttpServletResponse;
//
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.security.access.AccessDeniedException;
//import org.springframework.security.core.Authentication;
//import org.springframework.security.core.GrantedAuthority;
//import org.springframework.security.core.authority.SimpleGrantedAuthority;
//import org.springframework.stereotype.Component;
//import org.springframework.web.filter.OncePerRequestFilter;
//
//import fr.cirad.security.base.IRoleDefinition;
//import fr.cirad.tools.mongo.MongoTemplateManager;
//import fr.cirad.tools.security.TokenManager;
//import fr.cirad.web.controller.security.UserPermissionController;
//
//@Component
//public class ModuleAccessFilter extends OncePerRequestFilter {
//
//    @Autowired private ReloadableInMemoryDaoImpl userDao;
//    @Autowired private TokenManager tokenManager;
//
//    @Override
//    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
//            throws ServletException, IOException {
//
//        String sModule = request.getParameter("module");
//        if (sModule != null && MongoTemplateManager.get(sModule) != null && !MongoTemplateManager.isModulePublic(sModule)) {
//
//            String token = tokenManager.readToken(request);
//            Authentication auth = tokenManager.getAuthenticationFromToken(token);
//            Collection<? extends GrantedAuthority> authorities =
//                    auth != null ? userDao.getUserAuthorities(auth) : userDao.getLoggedUserAuthorities();
//
//            boolean fIsAnonymous = authorities != null
//                    && authorities.contains(new SimpleGrantedAuthority(IRoleDefinition.ROLE_ANONYMOUS));
//            boolean fIsAdmin = authorities != null
//                    && authorities.contains(new SimpleGrantedAuthority(IRoleDefinition.ROLE_ADMIN));
//            boolean fHasRequiredRole;
//
//            if (request.getRequestURI().startsWith(UserPermissionController.userPermissionURL)) {
//                if (userDao.getSupervisedModules(authorities).contains(sModule)) {
//                    fHasRequiredRole = true;
//                } else {
//                    Map<String, Collection<Comparable>> managedEntitiesByType =
//                            userDao.getManagedEntitiesByModuleAndType(authorities).get(sModule);
//                    fHasRequiredRole = managedEntitiesByType != null && managedEntitiesByType.size() > 0;
//                }
//            } else {
//                fHasRequiredRole = true; // FIXME (cf. commentaire d'origine dans GigwaAccessDecisionManager)
//            }
//
//            if (fIsAnonymous || (!fIsAdmin && !fHasRequiredRole)) {
//                throw new AccessDeniedException("You are not allowed to access module '" + sModule + "'");
//            }
//        }
//
//        chain.doFilter(request, response);
//    }
//}