public class asynApexRestarter {
    public static datetime haltedTime;
    public static void halt(){
        list<AsyncApexJob> asyncJobs = [ Select id ,Status from AsyncApexJob where Status = 'Queued' or Status='holding'];
        for ( AsyncApexJob aJob : asyncJobs ) {
			System.AbortJob(aJob.Id);
            asynApexRestarter.haltedTime = system.now();
			system.debug('  --  `- --- '+ ajob);
		}
    }
    public static void restart(){
        map<Id, AsyncApexJob> asyncJobsMap = new map<Id, AsyncApexJob>([ Select id ,Status, JobType, ApexClassId from AsyncApexJob where Status = 'Aborted' AND CreatedDate > :asynApexRestarter.haltedTime]);
        list<AsyncApexJob> asyncJobs = asyncJobsMap.values();
        map<Id, Id > mapAsyncJobsIdNId = new map<Id, Id>();
        for( AsyncApexJob aJob : asyncJobs){
            mapAsyncJobsIdNId.put(aJob.Id, aJob.ApexClassId);
        }
        map<Id, ApexClass> apexClassMap = new map<Id, ApexClass>([SELECT Id, Name FROM ApexClass WHERE Id IN :mapAsyncJobsIdNId.values()]);
        map<Id, string> mapAsyncIdNClassname = new map<Id, string>();
        map<Id, Type> mapAsyncIdNType = new map<Id, Type>();
        for(AsyncApexJob aj : asyncJobs){
            mapAsyncIdNClassname.put(aj.Id, apexClassMap.get(aj.ApexClassId).Name);
            mapAsyncIdNType.put(aj.Id, Type.forName((string)apexClassMap.get(aj.ApexClassId).Name));
        }
        system.debug(' var status mapAsyncIdNClassname '+mapAsyncIdNClassname);
        system.debug(' var status mapAsyncIdNType '+mapAsyncIdNType);
        for ( AsyncApexJob aJob : asyncJobs ) {
            AsyncApexJob jobInfo3;
            system.debug('classname  '+mapAsyncIdNClassname.get(aJob.Id));
            system.debug('apex type '+mapAsyncIdNType.get(aJob.Id).newInstance());
            //System.AbortJob(aJob.Id);
            switch on ((string)mapAsyncIdNClassname.get(aJob.Id)) {
                when 'BatchApex' {
                    Id jobId = database.executeBatch((Database.Batchable<sObject>)mapAsyncIdNType.get(aJob.Id).newInstance());
                    system.debug(' restarted batch job '+aJob);
                    jobInfo3 = [SELECT Status,NumberOfErrors FROM AsyncApexJob WHERE Id =:jobId];
        			system.debug('job restarted '+ jobInfo3);
                }
                when 'Queueable' {
                    Id jobId = System.enqueueJob((Queueable)mapAsyncIdNType.get(aJob.Id).newInstance());
                    system.debug(' restarted queue job '+aJob);
                    jobInfo3 = [SELECT Status,NumberOfErrors FROM AsyncApexJob WHERE Id =:jobId];
        			system.debug('job restarted '+ jobInfo3);
                }
            }
            system.debug('  --  `- --- '+ jobInfo3);
        } 
    }
}