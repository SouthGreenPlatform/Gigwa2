<%@ page import="fr.cirad.tools.mongo.MongoTemplateManager" %>
<%@ page import="fr.cirad.mgdb.model.mongo.maintypes.*" %>
<%@ page import="org.springframework.data.mongodb.core.MongoTemplate" %>
<%@ page import="org.springframework.data.mongodb.core.BulkOperations" %>

<%@ page import="com.mongodb.client.*" %>
<%@ page import="com.mongodb.client.model.*" %>
<%@ page import="com.mongodb.client.result.UpdateResult" %>
<%@ page import="org.bson.Document" %>
<%@ page import="org.bson.conversions.Bson" %>
<%@ page import="java.util.*" %>
<%@ page import="org.springframework.data.mongodb.core.query.*" %>
<%@ page import="com.mongodb.bulk.BulkWriteResult" %>
<%@ page import="org.springframework.security.core.context.SecurityContextHolder" %>
<%@ page import="org.springframework.security.core.Authentication" %>
<%@ page import="org.springframework.security.core.GrantedAuthority" %>

<html>
<head>
    <link rel="stylesheet" type="text/css" href="private/css/role_manager.css" title="style">
</head>
<body style="margin:15px">
<%
    // -------------------- Security check --------------------
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    boolean isAdmin = false;
    if(auth != null && auth.isAuthenticated()) {
        for(GrantedAuthority ga : auth.getAuthorities()) {
            if("ROLE_ADMIN".equals(ga.getAuthority())) { isAdmin = true; break; }
        }
    }
    if(!isAdmin) {
        out.println("<p><b>Access denied: you must be an administrator to use this page.</b></p>");
        return;
    }

    // -------------------- Parameters --------------------
    String module = request.getParameter("module");
    boolean fixNow = "true".equals(request.getParameter("fixNow"));

    // -------------------- MODULE OVERVIEW --------------------
    if(module == null || module.isEmpty()) {
        Collection<String> availableModules = MongoTemplateManager.getAvailableModules();
        out.println("<div style='font-weight:bold; font-size:14px; margin-bottom:20px;'>This page fixes databases where the number of alleles stored for a variant is inconsistent across records. This situation can lead to wrong search results when using the \"Number of alleles\"' filter. This is a rare case that can only happen when using multiple projects and/or runs, in the case where new alleles are encountered for known variants. From Gigwa v2.11 such problems will not occur anymore.</div>");

        for(String m : availableModules) {
            MongoTemplate mt = MongoTemplateManager.get(m);
            MongoCollection<Document> projects = mt.getCollection("projects");

            boolean showModule = false;
            String reason = "";
            long docCount = projects.countDocuments();

            if(docCount > 1) { showModule = true; reason="multiple runs in projects"; }
            else if(docCount==1) {
                Document doc = projects.find().first();
                if(doc!=null && doc.containsKey("rn")) {
                    Object rn = doc.get("rn"); int rnSize=0;
                    if(rn instanceof List) rnSize = ((List<?>) rn).size();
                    if(rnSize>1) { showModule = true; reason="single project with multiple runs"; }
                }
            }

            if(showModule) {
%>
<div style="margin-bottom:8px;">
    <span><b>Database:</b> <%= m %> - <%= reason %></span>
    <form method="get" action="fixVRD.jsp" style="display:inline;" onsubmit="window.open('', 'checkWindow_<%= m %>', 'width=1024,height=768'); this.target='checkWindow_<%= m %>';">
        <input type="hidden" name="module" value="<%= m %>"/>
        <button type="submit">Check for problematic VRD records</button>
    </form>
    <span id="module_status_<%= m %>" style="margin-left:10px;"></span>
</div>
<%
            }
        }
%>
<script>
    // populate each module's last known check from localStorage
    <% for(String m : availableModules) { %>
        (function(module){
            var span = document.getElementById("module_status_" + module);
            var infoJson = localStorage.getItem("fixVRD_" + module);
            if(span && infoJson){
                try {
                    var info = JSON.parse(infoJson);
                    span.textContent = info.count + " problematic records at " + info.datetime;
                    span.style.color = (info.count > 0) ? "red" : "green";
                } catch(e){ console.error(e); }
            }
        })("<%= m %>");
    <% } %>
</script>
<%
        return;
    }

    // -------------------- FIXNOW REFERER CHECK --------------------
    if(fixNow) {
        String referer = request.getHeader("Referer");
        if(referer == null || !referer.contains("fixVRD.jsp")) {
            out.println("<p><b>Direct access to fix mode is not allowed.</b></p>");
            return;
        }
    }

    // -------------------- COMMON PIPELINE --------------------
    MongoTemplate mongoTemplate = MongoTemplateManager.get(module);
    MongoCollection<Document> collection = mongoTemplate.getCollection(mongoTemplate.getCollectionName(VariantRunData.class));

    List<Bson> basePipeline = Arrays.asList(
        new Document("$match", new Document("ka.1", new Document("$exists", false))),
        new Document("$lookup",
            new Document("from","variants")
            .append("let", new Document("vi","$_id.vi"))
            .append("as","var")
            .append("pipeline", Arrays.asList(
                new Document("$match",
                    new Document("$expr", new Document("$eq", Arrays.asList("$$vi","$_id")))
                ),
                new Document("$project", new Document("ka",1))
            ))
        ),
        new Document("$project",
       	    new Document("_id","$_id")
    	        .append("ka","$ka")
    	        .append("varKa",
    	            new Document("$ifNull", Arrays.asList(
    	                new Document("$arrayElemAt", Arrays.asList("$var.ka", 0)),
    	                Collections.emptyList()   // default to empty array
    	            ))
    	        )
       	),
    	new Document("$match",
   		    new Document("$expr", new Document("$ne", Arrays.asList(
   		        new Document("$size","$varKa"),
   		        new Document("$size","$ka")
   		    )))
   		)
    );
%>

<!-- ===================== FLOATED LIST DIV ===================== -->
<div style="float:right; width:70%;">
<%
    if(!fixNow) {
%>
<ul>
<%
        int count = 0;
        try(MongoCursor<Document> cursor = collection.aggregate(basePipeline).allowDiskUse(true).iterator()) {
            while(cursor.hasNext()) {
                Document doc = cursor.next();
                count++;
%>
    <li>
        ID: <%= doc.get("_id").toString() %>
        | VRD alleles: <%= doc.get("ka") %>
        | Variant alleles: <%= doc.get("varKa") %>
    </li>
<%
            }
%>
</ul>
<%
        }
%>
</div>

<!-- ===================== COUNT + BUTTON DIV ===================== -->
<div style="margin-right:75%;">
<%
        out.println("<p><b>Problematic records found in DB " + module + ": " + count + "</b></p>");
%>
<script>
    // Update localStorage with latest count
    localStorage.setItem("fixVRD_<%= module %>", JSON.stringify({
        count: <%= count %>,
        datetime: new Date().toLocaleString()
    }));

    // Update module_status in parent if exists
    if(window.opener && !window.opener.closed){
        var span = window.opener.document.getElementById("module_status_<%= module %>");
        if(span){
            span.textContent = "<%= count %> problematic records at " + new Date().toLocaleString();
            span.style.color = (<%= count %> > 0) ? "red" : "green";
        }

        // reload parent immediately
        window.opener.location.reload();
    }
</script>

<%
        if(count>0){
%>
<form method="post" action="fixVRD.jsp">
    <input type="hidden" name="module" value="<%= module %>"/>
    <input type="hidden" name="fixNow" value="true"/>
    <button type="submit">Fix now</button>
</form>
<%
        }
    } else {
        // -------------------- FIXNOW BULK UPDATE --------------------
        BulkOperations bulkOps = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, VariantRunData.class);
        int batchSize = 1000; int currentBatch=0; long fixedCount=0;

        try(MongoCursor<Document> cursor = collection.aggregate(basePipeline).allowDiskUse(true).iterator()) {
            while(cursor.hasNext()){
                Document doc = cursor.next();
                Object id = doc.get("_id"); Object varKa = doc.get("varKa");

                bulkOps.updateOne(Query.query(Criteria.where("_id").is(id)), Update.update("ka", varKa));
                currentBatch++;
                if(currentBatch>=batchSize){
                    BulkWriteResult result = bulkOps.execute();
                    fixedCount += result.getModifiedCount();
                    bulkOps = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, VariantRunData.class);
                    currentBatch = 0;
                }
            }
            if(currentBatch>0){
                BulkWriteResult result = bulkOps.execute();
                fixedCount += result.getModifiedCount();
            }
        }

        out.println("<p><b>Fixed records: " + fixedCount + "</b></p>");
%>
<script>
    // Reset localStorage count after fixing
    localStorage.setItem("fixVRD_<%= module %>", JSON.stringify({
        count: 0,
        datetime: new Date().toLocaleString()
    }));

    // reload parent immediately
    if(window.opener && !window.opener.closed){
        window.opener.location.reload();
    }
</script>
<%
    }
%>
<div style="clear:both;"></div>
</body>
</html>
