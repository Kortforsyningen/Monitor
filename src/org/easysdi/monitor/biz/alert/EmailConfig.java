package org.easysdi.monitor.biz.alert;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

import org.apache.log4j.Logger;

/**
 * Holds the configuration necessary informations to send an e-mail.
 * 
 * @author Yves Grasset - arx iT
 * @version 1.0, 2010-03-19
 */
public class EmailConfig {
    
    private final Logger logger = Logger.getLogger(EmailConfig.class);

    private String senderAddress;
    private String smtpHost;
    private String smtpPassword;
    private String smtpUserName;
    private String language;
    private String recivers;
    private String initmail;
    private String querymail;
    private String outOfOder;

	/**
     * Instantiates the configuration.
     */
    public EmailConfig() {

        try {
            this.loadConfig();

        } catch (IOException e) {
            this.logger.error(
                "An error occurred while the e-mail configuration was parsed", 
                e);
        }
    }



    /**
     * Loads the configuration from the properties file.
     * 
     * @throws  IOException the properties file couldn't be read
     */
    private void loadConfig() throws IOException {
        final InputStream propStream = this.getClass().getClassLoader().getResourceAsStream("Email.properties");

        final Properties emailProps = new Properties();
        emailProps.load(propStream);

        this.definePropertiesFromDoc(emailProps);
    }



    /**
     * Defines this object's content from a properties file.
     * 
     * @param   emailProps  the properties file to read
     */
    private void definePropertiesFromDoc(Properties emailProps) {
        this.setSenderAddress(emailProps.getProperty("sender"));
        this.setSmtpHost(emailProps.getProperty("smtp.host"));
        this.setSmtpPassword(emailProps.getProperty("smtp.password"));
        this.setSmtpUserName(emailProps.getProperty("smtp.user"));
        this.setLanguage(emailProps.getProperty("language"));
        this.setReciver(emailProps.getProperty("recivers"));
        this.setInitmail(emailProps.getProperty("initmail"));
        this.setQuerymail(emailProps.getProperty("querymail"));
        this.setOutOfOder(emailProps.getProperty("outofordermail"));
    }



    /**
     * Defines the address to use as the sender.
     * 
     * @param   newSenderAddress    the sender's address
     */
    private void setSenderAddress(String newSenderAddress) {
        this.senderAddress = newSenderAddress;
    }

    /**
     * Gets the address to use as the sender.
     * 
     * @return  the sender's address
     */
    public String getSenderAddress() {
        return this.senderAddress;
    }
    
    public void setReciver(String recivers)
    {
    	this.recivers = recivers;
    }
    
    public String getReciver()
    {
    	return this.recivers;
    }


    /**
     * Defines the SMTP host responsible for sending the e-mail.
     * 
     * @param   newSmtpHost the SMTP host name (+ port if necessary)
     */
    private void setSmtpHost(String newSmtpHost) {
        this.smtpHost = newSmtpHost;
    }



    /**
     * Gets the SMTP host responsible for sending the e-mail.
     * 
     * @return  the SMTP host name
     */
    public String getSmtpHost() {
        return this.smtpHost;
    }

    


    /**
     * Defines the password used to connect to the SMTP host.
     * 
     * @param   newSmtpPassword the SMTP host password
     */
    private void setSmtpPassword(String newSmtpPassword) {
        this.smtpPassword = newSmtpPassword;
    }



    /**
     * Gets the password used to connect to the SMTP host.
     * 
     * @return  the SMTP host password
     */
    public String getSmtpPassword() {
        return this.smtpPassword;
    }



    /**
     * Defines the user name used to connect to the SMTP host.
     * 
     * @param   newSmtpUserName the SMTP host user name
     */
    @SuppressWarnings("unused")
	private void setSmtpUserName(String newSmtpUserName) {
        this.smtpUserName = newSmtpUserName;
    }



    /**
     * Gets the user name used to connect to the SMTP host.
     * 
     * @return  the SMTP host user name
     */
    public String getSmtpUserName() {
        return this.smtpUserName;
    }
    
    public String getLanguage() {
		return language;
	}


	public void setLanguage(String language) {
		this.language = language;
	}
	
	public String getInitmail()
	{
		return this.initmail;
	}
	
	public void setInitmail(String initmail)
	{
		this.initmail = initmail;
	}
	
	public String getQuerymail()
	{
		return this.querymail;
	}
	
	public void setQuerymail(String querymail)
	{
		this.querymail = querymail;
	}
	
	public String getOutOfOder()
	{
		return this.outOfOder;
	}
	
	public void setOutOfOder(String outOfOder)
	{
		this.outOfOder = outOfOder;
	}
}
