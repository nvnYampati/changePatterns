public class asynApexRestarter {
    public static void halt(){
        list<AsyncApexJob> asyncJobs = [ Select id ,Status from AsyncApexJob where Status = 'Queued' or Status='holding'];
        for ( AsyncApexJob aJob : asyncJobs ) {
			//System.AbortJob(aJob.Id);
			system.debug('  --  `- --- '+ ajob);
		}
    }
    public static void restart(){
        list<AsyncApexJob> asyncJobs = [ Select id ,Status, JobType, ApexClassId from AsyncApexJob where Status = 'Aborted'];
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
        for ( AsyncApexJob aJob : asyncJobs ) {
            //System.AbortJob(aJob.Id);
            switch on ((string)mapAsyncIdNClassname.get(aJob.Id)) {
                when 'BatchApex' {
                    Id jobId = database.executeBatch((Database.Batchable<sObject>)mapAsyncIdNType.get(aJob.Id).newInstance());
                }
                when 'Queueable' {
                    Id jobId = System.enqueueJob((Queueable)mapAsyncIdNType.get(aJob.Id).newInstance());
                }
            }
            system.debug('  --  `- --- '+ ajob);
        } 
    }
}