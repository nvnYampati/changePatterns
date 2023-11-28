public class ProcessAutomationSwitches {
    public static boolean All_Processes_Disabled{get {
        if(All_Processes_Disabled == null){
            All_Processes_Disabled = (Process_Automation_Switches__c.getInstance()?.Disable_All_Processes__c == true);
        } return All_Processes_Disabled;
    } 
    set;}
    public static boolean Account_Process_Disabled{get {
        if(Account_Process_Disabled == null){
            Account_Process_Disabled = (Process_Automation_Switches__c.getInstance()?.Disable_Account_Process__c == true);
        } return All_Processes_Disabled;
    }
    set;}
    
    /*when a new switch is added to custom settings Process_Automation_Switches__c,
	 *add the below code and provide suitable changes for sObject name
	 *
		private static boolean sObject_Process_Disabled {get {
        	if(sObject_Process_Disabled == null){
            	sObject_Process_Disabled = (Process_Automation_Switches__c.getInstance()?.Disable_sObject_Process__c == true);
        	} return All_Processes_Disabled;
     *	}
   	 *	 set;}
	 *
	 */
}