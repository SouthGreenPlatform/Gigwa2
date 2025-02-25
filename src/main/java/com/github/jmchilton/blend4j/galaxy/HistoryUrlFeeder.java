package com.github.jmchilton.blend4j.galaxy;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.InetAddress;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.UnknownHostException;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import org.apache.commons.io.IOUtils;
import org.codehaus.jackson.annotate.JsonProperty;

import com.sun.jersey.api.client.ClientResponse;

public class HistoryUrlFeeder extends ToolsClientImpl {

    public HistoryUrlFeeder(GalaxyInstance galaxyInstance) {
        super((GalaxyInstanceImpl) galaxyInstance);
    }
    
    public ClientResponse historyUrlFeedRequest(final UrlFileUploadRequest request) throws IOException {
        final Map<String, String> uploadParameters = new HashMap<String, String>();
        String fileUrl = request.getFileUrl();
        
        if (isLocalURL(fileUrl)) {
        	if (isBinary(fileUrl)) {
                try (InputStream in = new URL(fileUrl).openStream()) {                        
                    File tempFile = File.createTempFile("galaxy_upload_", null);
                    FileOutputStream out = new FileOutputStream(tempFile);
                    IOUtils.copy(in, out);
                    
                    ToolsClient toolsClient = getGalaxyInstance().getToolsClient();
                    FileUploadRequest fur = new FileUploadRequest(request.getHistoryId(), tempFile);
                    fur.setFileType(fileUrl.toLowerCase().endsWith(".vcf.gz") ? "vcf_bgzip" : request.getFileType());
                    fur.setDatasetName(Paths.get(request.getFileUrl()).getFileName().toString());
                    ClientResponse resp = toolsClient.uploadRequest(fur);
                    
                    tempFile.delete();
                    return resp;	// CASE 1: binary file on localhost => create a temp copy and use normal upload because we couldn't find a way to push binary data
                }
        	}
        	else
        		uploadParameters.put("files_0|url_paste", IOUtils.toString(new URL(fileUrl), "UTF-8"));	// CASE 2: text file on localhost => transmit the contents
        }
        else
        	uploadParameters.put("files_0|url_paste", fileUrl);	// CASE 3: file is not on localhost => transmit its URL since it should be reachable from Galaxy server

        uploadParameters.put("files_0|NAME", Paths.get(request.getFileUrl()).getFileName().toString());
        uploadParameters.put("dbkey", request.getDbKey());
        uploadParameters.put("file_type", request.getFileType());
        uploadParameters.putAll(request.getExtraParameters());
        final Map<String, Object> requestParameters = new HashMap<String, Object>();
        requestParameters.put("tool_id", request.getToolId());
        requestParameters.put("history_id", request.getHistoryId());
        requestParameters.put("inputs", write(uploadParameters));
        requestParameters.put("type", "upload_dataset");
        return multipartPost(getWebResource(), requestParameters, prepareUploads(Arrays.asList()));
    }

    private boolean isBinary(String httpFileUrl) throws IOException {
        try (InputStream inputStream = new URL(httpFileUrl).openStream()) {
            byte[] buffer = new byte[1024]; // Read the first 1024 bytes
            int bytesRead = inputStream.read(buffer);

            if (bytesRead > 0)
                for (int i = 0; i < bytesRead; i++)
                    if (buffer[i] == 0 || buffer[i] < 0)
                        return true;
            return false;
        }
    }

	public static boolean isLocalURL(String urlString) {
        try {
            URL url = new URL(urlString);
            String host = url.getHost();
            InetAddress localhost = InetAddress.getLocalHost();
            InetAddress[] allLocal = InetAddress.getAllByName(localhost.getCanonicalHostName());
            for (InetAddress local : allLocal) {
                if (local.getHostAddress().equals(host) || host.equals("localhost")) {
                    return true;
                }
            }
            return false;
        } catch (MalformedURLException | UnknownHostException e) {
            return false; // Consider it as non-local if URL is malformed or host address cannot be resolved
        }
    }

    public static class UrlFileUploadRequest {
        private final String historyId;
        private final String fileUrl;
        private String fileType = "auto";
        private String dbKey = "?";
        private String toolId = "upload1";
        private Map<String, String> extraParameters = new HashMap<String, String>();

        public Map<String, String> getExtraParameters() {
            return extraParameters;
        }

        public void setExtraParameters(final Map<String, String> extraParameters) {
            this.extraParameters = extraParameters;
        }

        public UrlFileUploadRequest(final String historyId, final String fileUrl) {
            this.historyId = historyId;
            this.fileUrl = fileUrl;
        }

        public String getFileType() {
            return fileType;
        }

        public void setFileType(String fileType) {
            this.fileType = fileType;
        }

        public String getDbKey() {
            return dbKey;
        }

        public void setDbKey(String dbKey) {
            this.dbKey = dbKey;
        }

        public String getToolId() {
            return toolId;
        }

        public String getHistoryId() {
            return historyId;
        }

        @JsonProperty("files_0|url_paste")
        public String getFileUrl() {
            return fileUrl;
        }

        public void setToolId(String toolId) {
            this.toolId = toolId;
        }
    }
}
