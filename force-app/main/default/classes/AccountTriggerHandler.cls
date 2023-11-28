public class AccountTriggerHandler implements TriggerHandlerFramework {
    public void beforeInsert(list<sObject> newList){
        AccountService.getInstance().giveMessage();
    }
    public void afterInsert(list<sObject> newList){
        
    }
    public void beforeUpdate(list<sObject> newList, map<Id, sObject> newMap, list<sObject> oldList, map<Id, sObject> oldMap){
        
    }
    public void afterUpdate(list<sObject> newList, map<Id, sObject> newMap, list<sObject> oldList, map<Id, sObject> oldMap){
        
    }
    public void beforeDelete(list<sObject> newList, map<Id, sObject> newMap, list<sObject> oldList, map<Id, sObject> oldMap){
        
    }
    public void afterDelete(list<sObject> newList, map<Id, sObject> newMap, list<sObject> oldList, map<Id, sObject> oldMap){
        
    }
    public void afterUndelete(list<sObject> newList, map<Id, sObject> newMap){
        
    }
}