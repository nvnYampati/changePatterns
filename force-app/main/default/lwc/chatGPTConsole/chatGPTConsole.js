import { LightningElement } from 'lwc';
import askGPT from '@salesforce/apex/OpenAIController.askGPT';

export default class ChatGPTConsole extends LightningElement {
    question = '';
    chatInputValue;
    error;
    answer = '';
    showChat = true;
    counter = 1;
    _responses = [ { id : this.counter, 
                    response : 'ask me!',
                    liAtt : 'slds-chat-listitem slds-chat-listitem_inbound',
                    showAvtar : true,
                    divAtt : 'slds-chat-message__text slds-chat-message__text_inbound',
                    initials : 'CG'
                    },];
                    
    get responses(){
        console.log('from get  '+JSON.stringify(this._responses));
        return this._responses;
    }

    handleInputOnChange(event){
        let input = event.target.value;
        this.question = input; 
    }
    handleChatClick(){
        this.counter++;
        let replyObj = { id : this.counter, 
                            response : this.question,
                            liAtt : 'slds-chat-listitem slds-chat-listitem_outbound',
                            showAvtar : false,
                            divAtt : 'slds-chat-message__text slds-chat-message__text_outbound-agent',
                            initials : 'YOU'
                            };
        this._responses = [...this._responses, replyObj];
        console.log('Object is '+this._responses);
        askGPT( { question : this.question} ).then(
            (result) => {
                let obj = { id : this.counter, 
                    response : result,
                    liAtt : 'slds-chat-listitem slds-chat-listitem_inbound',
                    showAvtar : true,
                    divAtt : 'slds-chat-message__text slds-chat-message__text_inbound',
                    initials : 'CG'
                };
                this._responses = [...this._responses, obj];
                console.log(' from apex'+JSON.stringify(result));
                this.chatInputValue = null;
            }
        ).catch( (error) => {
            this.error = error;
        }).finally();
    }
}