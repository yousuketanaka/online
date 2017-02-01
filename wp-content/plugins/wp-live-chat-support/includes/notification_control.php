<?php



function wplc_record_chat_notification($type,$cid,$data) {
    if ($cid) {
        do_action("wplc_hook_chat_notification",$type,$cid,$data);
    }
    return true;
    
 
}


add_action("wplc_hook_chat_notification","wplc_filter_control_chat_notification_user_loaded",10,3);
function wplc_filter_control_chat_notification_user_loaded($type,$cid,$data) {
    if ($type == "user_loaded") {

        /**
         * Only run if the chat status is not 1 or 5 (complete or browsing)
         * 1 is questionable here, we may have to remove it at a later stage.
         *  - Nick
         */
        if (isset($data['chat_data']) && isset($data['chat_data']->status) && (intval($data['chat_data']->status) != 5 || intval($data['chat_data']->status) != 5)) {

            global $wpdb;
            global $wplc_tblname_msgs;


            $msg = sprintf(__("User is browsing <small><a href='%s' target='_BLANK'>%s</a></small>","wplivechat"),$data['uri'],wplc_shortenurl($data['uri']));

            $wpdb->insert( 
                $wplc_tblname_msgs, 
                array( 
                        'chat_sess_id' => $cid, 
                        'timestamp' => current_time('mysql'),
                        'msgfrom' => __('System notification',"wplivechat"),
                        'msg' => $msg,
                        'status' => 0,
                        'originates' => 3
                ), 
                array( 
                        '%s', 
                        '%s',
                        '%s',
                        '%s',
                        '%d',
                        '%d'
                ) 
            );
        }
    }
    return $type;
} 


add_action("wplc_hook_chat_notification","wplc_filter_control_chat_notification_await_agent",10,3);
function wplc_filter_control_chat_notification_await_agent($type,$cid,$data) {
    $wplc_settings = get_option("WPLC_SETTINGS");
    if(isset($wplc_settings['wplc_use_node_server']) && intval($wplc_settings['wplc_use_node_server']) == 1){ } else {

        if ($type == "await_agent") {
            global $wpdb;
            global $wplc_tblname_msgs;
            $wpdb->insert( 
                $wplc_tblname_msgs, 
                array( 
                        'chat_sess_id' => $cid, 
                        'timestamp' => current_time('mysql'),
                        'msgfrom' => __('System notification',"wplivechat"),
                        'msg' => $data['msg'],
                        'status' => 0,
                        'originates' => 0
                ), 
                array( 
                        '%s', 
                        '%s',
                        '%s',
                        '%s',
                        '%d',
                        '%d'
                ) 
            );
        }
    }
    return $type;
} 


add_action("wplc_hook_chat_notification","wplc_filter_control_chat_notification_agent_joined",10,3);
function wplc_filter_control_chat_notification_agent_joined($type,$cid,$data) {


    if ($type == "joined") {

        global $wpdb;
        global $wplc_tblname_msgs;


        $user_info = get_userdata(intval($data['aid']));
        $agent = $user_info->display_name;
        $msg = $agent . " ". __("has joined the chat.","wplivechat");

        $wpdb->insert( 
            $wplc_tblname_msgs, 
            array( 
                    'chat_sess_id' => $cid, 
                    'timestamp' => current_time('mysql'),
                    'msgfrom' => __('System notification',"wplivechat"),
                    'msg' => $msg,
                    'status' => 0,
                    'originates' => 0
            ), 
            array( 
                    '%s', 
                    '%s',
                    '%s',
                    '%s',
                    '%d',
                    '%d'
            ) 
        );
    }
    return $type;
} 
