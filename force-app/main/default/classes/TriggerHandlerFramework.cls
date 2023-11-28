public interface TriggerHandlerFramework {
	void beforeInsert(list<sObject> newList);
    void afterInsert(list<sObject> newList);
    void beforeUpdate(list<sObject> newList, map<Id, sObject> newMap, list<sObject> oldList, map<Id, sObject> oldMap);
    void afterUpdate(list<sObject> newList, map<Id, sObject> newMap, list<sObject> oldList, map<Id, sObject> oldMap);
    void beforeDelete(list<sObject> newList, map<Id, sObject> newMap, list<sObject> oldList, map<Id, sObject> oldMap);
    void afterDelete(list<sObject> newList, map<Id, sObject> newMap, list<sObject> oldList, map<Id, sObject> oldMap);
    void afterUndelete(list<sObject> newList, map<Id, sObject> newMap);    
}