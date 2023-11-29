@isTest
public class asynApexRestarterTester {
	@isTest
    public static void test1(){
        list<Id> jobIdList = new list<Id>();
        ID jobID1 = System.enqueueJob(new AsyncExecutionExample()); jobIdList.add(jobID1);
		ID jobID2 = System.enqueueJob(new AsyncExecutionExample()); jobIdList.add(jobID2);
		ID jobID9 = System.enqueueJob(new AsyncExecutionExample()); jobIdList.add(jobID9);
		ID jobID8 = database.executeBatch(new AccountUpdateBatchJob()); jobIdList.add(jobID8);
		ID jobID7 = database.executeBatch(new AccountUpdateBatchJob()); jobIdList.add(jobID7);
        list<AsyncApexJob> jobInfo1 = [SELECT Status,NumberOfErrors FROM AsyncApexJob WHERE Id IN :jobIdList];
		system.debug('jobs so far 1 '+ jobInfo1.size());
        system.debug('jobs so far 1 '+ jobInfo1);
        asynApexRestarter.halt();
		ID jobID6 = database.executeBatch(new AccountUpdateBatchJob()); jobIdList.add(jobID6);
		ID jobID5 = System.enqueueJob(new AsyncExecutionExample()); jobIdList.add(jobID5);
		ID jobID4 = database.executeBatch(new AccountUpdateBatchJob()); jobIdList.add(jobID4);
		ID jobID3 = System.enqueueJob(new AsyncExecutionExample()); jobIdList.add(jobID3);
		list<AsyncApexJob> jobInfo2 = [SELECT Status,NumberOfErrors FROM AsyncApexJob WHERE Id IN :jobIdList];
		system.debug('jobs so far 2 '+ jobInfo2.size());
        system.debug('jobs so far 2 '+ jobInfo2);
        asynApexRestarter.halt();
        system.debug('restarting jobs ');
        asynApexRestarter.restart();
        list<AsyncApexJob> jobInfo3 = [SELECT Status,NumberOfErrors FROM AsyncApexJob WHERE Id IN :jobIdList];
        system.debug('jobs so far 3 '+ jobInfo3.size());
        system.debug('jobs so far 3 '+ jobInfo3);
    }
}