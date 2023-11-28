trigger AccountTrigger on Account (before insert) {
    if(!ProcessAutomationSwitches.All_Processes_Disabled && !ProcessAutomationSwitches.Account_Process_Disabled){
        TriggerHandlerDispatcher.run(new AccountTriggerHandler());
    }  
}