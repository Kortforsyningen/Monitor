package org.easysdi.monitor.gui.webapp.controllers;

import java.io.IOException;
import java.util.Date;
import java.util.Map;

import javax.naming.NamingException;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.transform.TransformerException;

import org.codehaus.jackson.node.ArrayNode;
import org.easysdi.monitor.biz.job.Job;
import org.easysdi.monitor.biz.job.Query;
import org.easysdi.monitor.biz.job.Sla;
import org.easysdi.monitor.biz.logging.AbstractAggregateHourLogEntry;
import org.easysdi.monitor.biz.logging.LogManager;
import org.easysdi.monitor.gui.webapp.LogSearchParams;
import org.easysdi.monitor.gui.webapp.LogSlaHelper;
import org.easysdi.monitor.gui.webapp.MonitorInterfaceException;
import org.easysdi.monitor.gui.webapp.ReportExportHelper;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

/**
 * Servlet implementation class GroupReportExportController
 */
@Controller
@RequestMapping({ "/groups/{groupId}/requests/{requestId}/aggHourLogs/export/{xsltId}" })
public class RequestAggHourLogExportController extends AbstractMonitorController {
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public RequestAggHourLogExportController() {
        super();
        // TODO Auto-generated constructor stub
    }

	/**
	 * @throws MonitorInterfaceException 
	 * @throws TransformerException 
	 * @throws NamingException 
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
    @RequestMapping(method = RequestMethod.GET)
	protected void doGet(HttpServletRequest request, HttpServletResponse response, @PathVariable String groupId, @PathVariable String requestId, @PathVariable String xsltId) throws ServletException, IOException, MonitorInterfaceException, TransformerException, NamingException {
    	
        final Map<String, String> requestParams = this.getRequestParametersMap(request);
        final LogSearchParams searchParams = LogSearchParams.createFromParametersMap(requestParams);
        Map<Date, AbstractAggregateHourLogEntry> logEntries;
                
        String slaName = "Default";
        if (requestParams.get("useSla") != null) {
        	slaName = Sla.getFromIdString(requestParams.get("useSla")).getName();
        }
        
        final Job job = this.getJobProtected(groupId, request, response);
        Query monRequest = job.getQueryFromIdString(requestId);
        
		final LogManager requestLogManager = new LogManager(monRequest);
		    		    		
		logEntries = requestLogManager.getAggregHourLogsSubset(searchParams.getMinDate(),
                searchParams.getMaxDate(),
                searchParams.getMaxResults(),
                searchParams.getStartIndex());
		
		if (requestParams.get("useSla") != null) {
			logEntries = LogSlaHelper.getAggHourLogForSla(slaName, logEntries);
		}
		
		ArrayNode jsonLogsCollection = 
        	ReportExportHelper.CreateJSONData_AggHourLog(requestLogManager, logEntries, searchParams, 
        			job, monRequest, slaName);
               
    	String xml = ReportExportHelper.ConvertJSONReportDataToXml(jsonLogsCollection);
    	String dataOut = ReportExportHelper.DoTransformation(xml, xsltId);
    	
    	response.setContentType("application/octet-stream");
		response.addHeader("Content-disposition", "attachment; filename=" + 
				ReportExportHelper.GenerateXsltOutputFilename(xsltId));
    	
		javax.servlet.ServletOutputStream out = response.getOutputStream();
		out.print(dataOut);
		out.flush();

	}

}
