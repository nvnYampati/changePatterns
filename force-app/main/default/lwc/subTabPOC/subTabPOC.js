import { api, LightningElement, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';

export default class SubTabPOC extends LightningElement {
    @api recordId;
   
    accountId;
    openAccountButtonDisabled = true;
   
    @wire(getRecord, { recordId: '$recordId', fields: ['Contact.AccountId']})
    getRecordAccount({ data }) {
      if (data) {
        this.accountId = data.fields.AccountId.value;
        this.openAccountButtonDisabled = false;
      }
    }
   
    onOpenAccountClick() {
      this.invokeWorkspaceAPI('isConsoleNavigation').then(isConsole => {
        if (isConsole) {
          this.invokeWorkspaceAPI('getFocusedTabInfo').then(focusedTab => {
            this.invokeWorkspaceAPI('openSubtab', {
              parentTabId: focusedTab.tabId,
              recordId: this.accountId,
              focus: true
            }).then(tabId => {
              console.log("Solution #2 - SubTab ID: ", tabId);
            });
          });
        }
      });
    }

    async openNewSubTabHandler() {
        let compDefination = {
            componentDef: "c:subTabForm",
            attributes: {

            }
        }
        let compBase64 = btoa(JSON.stringify(compDefination));
        let foucedTabInfo = await this.invokeWorkspaceAPI('getFocusedTabInfo');
        await this.invokeWorkspaceAPI('openSubtab', {
            parentTabId: foucedTabInfo.tabId,
            url: `#${compBase64}`,
            focus: true
        })
    }
   
    invokeWorkspaceAPI(methodName, methodArgs) {
      return new Promise((resolve, reject) => {
        const apiEvent = new CustomEvent("internalapievent", {
          bubbles: true,
          composed: true,
          cancelable: false,
          detail: {
            category: "workspaceAPI",
            methodName: methodName,
            methodArgs: methodArgs,
            callback: (err, response) => {
              if (err) {
                  return reject(err);
              } else {
                  return resolve(response);
              }
            }
          }
        });
   
        window.dispatchEvent(apiEvent);
      });
    }
}