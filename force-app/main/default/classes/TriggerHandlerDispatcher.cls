public class TriggerHandlerDispatcher {
    public TriggerHandlerDispatcher(){}
    public static void run(TriggerHandlerFramework handler){
        switch on trigger.operationType{
            when BEFORE_INSERT{
                handler.beforeInsert(trigger.new);
            }
            when AFTER_INSERT{
                handler.afterInsert(trigger.new);
            }
            when BEFORE_UPDATE{
                handler.beforeUpdate(trigger.new, trigger.newMap, trigger.old, trigger.oldMap);
            }
            when AFTER_UPDATE{
                handler.afterUpdate(trigger.new, trigger.newMap, trigger.old, trigger.oldMap);
            }
            when BEFORE_DELETE{
                handler.beforeDelete(trigger.new, trigger.newMap, trigger.old, trigger.oldMap);
            }
            when AFTER_DELETE{
                handler.afterDelete(trigger.new, trigger.newMap, trigger.old, trigger.oldMap);
            }
            when AFTER_UNDELETE{
                handler.afterUndelete(trigger.new, trigger.newMap);
            }
        }
    }
}