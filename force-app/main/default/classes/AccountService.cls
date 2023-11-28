public class AccountService {
    @testVisible private static AccountService thisInstance = null;
    
    public static AccountService getInstance(){
        if(thisInstance == null){
            thisInstance = new AccountService();
        }
        return thisInstance;
    }
    
    public void giveMessage(){
        system.debug('Called from Account Service');
    }
}