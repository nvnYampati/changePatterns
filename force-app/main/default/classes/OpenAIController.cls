public class OpenAIController {
    @AuraEnabled 
    public static string askGPT( string question ){
        return 'replying '+question;
    }
}