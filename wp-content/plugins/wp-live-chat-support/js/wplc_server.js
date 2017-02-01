/*
 * Hanldes Message transportation within WPLC
*/
var wplc_server_method = null;
var wplc_supress_server_logs = true; //We are now surpressing server logs
var wplc_node_socket = null; //Will not be set unless
var wplc_node_send_queue = new Array(); 
var wplc_node_message_receiver = null;
var wplc_node_message_restart_handler = null;
var wplc_node_client_event_logger = null;
var wplc_node_sockets_ready = false;
var wplc_transport_prepared = false;
 
var wplc_node_async_array = new Array(); //Array which will be sent to our async URL for storage
var wplc_node_async_send_rate = 1; //Amount of messages that need to be present before we sent the async request
var wplc_node_async_cookie_check_complete = false;

var wplc_node_port_open = true; //This can be set to false to prevent any future data being sent 
var wplc_node_is_client_typing = false;
var wplc_node_is_pair_typing_indicator_visible = false;
var wplc_node_pair_name = "";

var wplc_node_switch_ajax_complete = false;
var wplc_node_retry_count = 0;



function WPLCServer(){
	var wplc_server_ref = this;
	//Default to ajax until chat starts
	wplc_server_method = WPLCServer.Ajax;
	wplc_server_ref.send = wplc_server_method.send;

	wplc_server_ref.isInSocketMode = wplc_server_method.isInSocketMode;
	wplc_server_ref.isPreparingSocketMode = wplc_server_method.isPreparingSocketMode;
	wplc_server_ref.transportPrepared = wplc_server_method.transportPrepared;
	wplc_server_ref.asyncStorage = wplc_server_method.asyncStorage;
	wplc_server_ref.forceClosePort = wplc_server_method.forceClosePort;
	wplc_server_ref.sendMessage = wplc_server_method.sendMessage;


	wplc_server_ref.prepareTransport = function(callback, messageHandler, restartHandler, clientEventLog){
		wplc_server_log("-------------------");
		wplc_server_log("Preparing Transport");
		if(typeof wplc_use_node_server !== "undefined" && wplc_use_node_server === "true"){
			if(window.WebSocket){
				//Sockets are supported
				wplc_server_method = WPLCServer.Socket;
				wplc_server_log("Socket Mode");
			} else {
				wplc_server_method = WPLCServer.Ajax;
				wplc_server_log("Ajax Mode");
			}
		} else {
			wplc_server_method = WPLCServer.Ajax;
			wplc_server_log("Ajax Mode");
		}

		wplc_server_method.init(function(){
			wplc_server_ref.send = wplc_server_method.send;
			wplc_server_ref.isInSocketMode = wplc_server_method.isInSocketMode;
			wplc_server_ref.isPreparingSocketMode = wplc_server_method.isPreparingSocketMode;
			wplc_server_ref.transportPrepared = wplc_server_method.transportPrepared;
			wplc_server_ref.asyncStorage = wplc_server_method.asyncStorage;
			wplc_server_ref.forceClosePort = wplc_server_method.forceClosePort;
			wplc_server_ref.sendMessage = wplc_server_method.sendMessage;

			if(typeof callback === "function"){
				callback();
			}
		}, messageHandler, function(){
			wplc_server_method = WPLCServer.Ajax;
			wplc_server_log("Ajax Mode - Fail Over");

			wplc_server_ref.send = wplc_server_method.send;
			wplc_server_ref.isInSocketMode = wplc_server_method.isInSocketMode;
			wplc_server_ref.isPreparingSocketMode = function(){ return false; };
			wplc_server_ref.transportPrepared = wplc_server_method.transportPrepared;
			wplc_server_ref.asyncStorage = wplc_server_method.asyncStorage;
			wplc_server_ref.forceClosePort = wplc_server_method.forceClosePort;
			wplc_server_ref.sendMessage = wplc_server_method.sendMessage;

			if(typeof wplc_ajaxurl !== "undefined" && typeof wplc_nonce !== "undefined" && typeof wplc_cid !== "undefined"){
				var wplc_fail_over_data = {
                        action: 'wplc_node_switch_to_ajax',
                        security: wplc_nonce,
                        cid: wplc_cid
                };

                jQuery.ajax({
					url  : wplc_ajaxurl,
					data : wplc_fail_over_data,
					type : "POST",
					timeout : 120000,
					success : function(response){
						wplc_server_log("Ajax Mode Enabled");
					},
					error : function(error, exception){
						wplc_server_log("Chat Fail Over Could Not Be Setup");
					},
					complete : function(response){
						if(typeof callback === "function"){
							callback();
						}
					}
				});
			}
		}, restartHandler, clientEventLog);

		wplc_server_log("Transport Prepared");
		wplc_server_log("-------------------");
		wplc_transport_prepared = true;
	}

	wplc_server_ref.browserIsSocketReady = function(){
		if(typeof wplc_use_node_server !== "undefined" && wplc_use_node_server === "true"){
			if(window.WebSocket){
				return true;
			} else {
				return false;
			}
		} else {
			return false; 
		}
	}
}

WPLCServer.Socket = {
	init : function(callback, messageHandler, failOver, restartHandler, clientEventLog){
		wplc_node_message_receiver = (typeof messageHandler !== "undefined" && typeof messageHandler === "function") ? messageHandler : false;
		wplc_node_message_restart_handler = (typeof restartHandler !== "undefined" && typeof restartHandler === "function") ? restartHandler : false;
		wplc_node_client_event_logger = (typeof clientEventLog !== "undefined" && typeof clientEventLog === "function") ? clientEventLog : false;

		wplc_server_log("Socket Init");
		wplc_node_socket = new WebSocket('wss://wp-livechat.us-2.evennode.com');

		if(wplc_node_async_cookie_check_complete !== true){
			//Check if there are any messages we forgot to send via async
			if(typeof Cookies !== "undefined" && typeof Cookies === "function"){
				var wplc_node_async_cookie_data = Cookies.getJSON("wplc_server_async_storage");
				if(typeof wplc_node_async_cookie_data !== "undefined" && wplc_node_async_cookie_data !== "undefined" && wplc_node_async_cookie_data !== undefined && wplc_node_async_cookie_data !== null){
					wplc_server_log("Async Cookies Found -> Sync...");
					wplc_node_parse_async_from_object(wplc_node_async_cookie_data, function(){
						wplc_node_async_cookie_check_complete = true;
					});
				}
			} 
		}

		wplc_node_socket.onerror = function(event){
			wplc_server_error("Could not connect to server. Changing transport method.");
			if(typeof failOver === "function" && wplc_node_sockets_ready !== true){
				failOver();
				wplc_node_switch_ajax_complete = true;
				if(typeof wplc_node_client_event_logger !== "undefined" && typeof wplc_node_client_event_logger === "function"){
					wplc_node_client_event_logger("Connection Error - Switching methods");
				}
			}
		}

		wplc_node_socket.onopen = function(event) {
			wplc_server_log("This socket is open");
			wplc_node_sockets_ready = true; //Sockets are available and ready for use
			if(typeof callback === "function"){
				callback();
			}
		}

		wplc_node_socket.onmessage = function(event){
			if(typeof wplc_node_message_receiver === "function" && wplc_node_message_receiver !== false && wplc_node_message_receiver !== null){
				//Delegate to handler 
				if(wplc_node_port_open){
					wplc_node_message_receiver(event.data);
					wplc_node_global_message_receiver(event.data);
				}
			}

		}

		wplc_node_socket.onclose = function(event) {
			wplc_server_log("This socket is closed");
			if (typeof wplc_node_message_restart_handler === "function") {
				if (wplc_node_retry_count < 5 && wplc_node_switch_ajax_complete !== true) {
					setTimeout(function(){
						wplc_node_message_restart_handler(event.data);
						wplc_node_retry_count++;
						if(typeof wplc_node_client_event_logger !== "undefined" && typeof wplc_node_client_event_logger === "function"){
							wplc_node_client_event_logger("Connection Error - Retrying in 5 seconds...");
						}
					}, 5000);
				} else {
					if(wplc_node_retry_count >= 5){
						if(typeof wplc_node_client_event_logger !== "undefined" && typeof wplc_node_client_event_logger === "function"){
							wplc_node_client_event_logger("Connection Error - Please refresh your browser");
						}
					}
				}
			}
		}

		
	},
	send : function (wplc_send_url, wplc_send_data, wplc_send_type, wplc_send_timeout, wplc_send_success_callback, wplc_send_fail_callback, wplc_send_complete_callback){
		wplc_origin_url = wplc_send_url.replace("/wp-admin/admin-ajax.php", "");
		wplc_send_data.origin_url = wplc_origin_url;
		wplc_socket_send(wplc_send_data, wplc_send_success_callback, wplc_send_fail_callback, wplc_send_complete_callback);

		if(wplc_node_async_cookie_check_complete){
			//Now lets update the sync quick
			wplc_socket_async_storage_handler(wplc_send_url, wplc_send_data, wplc_send_timeout);
			wplc_node_async_cookie_check_complete = false; //Stop infinite loop
		}
	},
	isInSocketMode : function (){
		return wplc_node_sockets_ready;
	},
	isPreparingSocketMode : function(){
		var preparing = false;
		if(typeof wplc_use_node_server !== "undefined" && wplc_use_node_server === "true"){
			if(window.WebSocket){
				preparing = true;
			}
		}

		return preparing;
	},
	transportPrepared : function(){
		return wplc_transport_prepared;
	},
	asyncStorage : function(wplc_send_url, wplc_send_data, wplc_send_timeout){
		wplc_node_async_array.push(wplc_send_data.msg);

		if(typeof Cookies !== "undefined" && typeof Cookies === "function"){
			Cookies.set('wplc_server_async_storage', JSON.stringify(wplc_node_async_array), { expires: 1, path: '/' });
		}

		if(wplc_node_async_array.length >= wplc_node_async_send_rate){
			wplc_socket_async_storage_handler(wplc_send_url, wplc_send_data, wplc_send_timeout);
		}
	},
	forceClosePort : function(){
		wplc_node_port_open = false;
	},
	sendMessage : function(wplc_send_url, wplc_send_data, wplc_send_type, wplc_send_timeout, wplc_send_success_callback, wplc_send_fail_callback, wplc_send_complete_callback){
		wplc_origin_url = wplc_send_url.replace("/wp-admin/admin-ajax.php", "");
		wplc_send_data.origin_url = wplc_origin_url;
		wplc_socket_add_to_queue(wplc_send_data, wplc_send_success_callback, wplc_send_fail_callback, wplc_send_complete_callback);
	}
};

WPLCServer.Ajax = {
	init : function(callback, messageHandler, failOver, restartHandler, clientEventLog){
		wplc_server_log("Ajax Init");
		if(typeof callback === "function"){
			callback();
		}
	},
	send : function (wplc_send_url, wplc_send_data, wplc_send_type, wplc_send_timeout, wplc_send_success_callback, wplc_send_fail_callback, wplc_send_complete_callback){
		jQuery.ajax({
			url  : wplc_send_url,
			data : wplc_send_data,
			type : wplc_send_type,
			timeout : wplc_send_timeout,
			success : function(response){
				if(typeof wplc_send_success_callback === "function"){
					if(typeof wplc_send_data['action'] !== "undefined" && wplc_send_data['action'] !== "wplc_start_chat"){ //Is this the start?
						wplc_send_success_callback(response);
					} else {
						//Check if we are going to go into socket mode after this? 
						if(typeof wplc_use_node_server !== "undefined" && wplc_use_node_server === "true"){
							if(window.WebSocket){
								wplc_send_success_callback(response); //Send the data if we are going to sockets after this
							}
						}
					}
				}
			},
			error : function(error, exception){
				if(typeof wplc_send_fail_callback === "function"){
					wplc_send_fail_callback(error, exception);
				}
			},
			complete : function(response){
				if(typeof wplc_send_complete_callback === "function"){
					wplc_send_complete_callback(response);
				}
			}
		});
	},
	isInSocketMode : function (){
		return wplc_node_sockets_ready;
	},
	isPreparingSocketMode : function(){
		var preparing = false;
		if(typeof wplc_use_node_server !== "undefined" && wplc_use_node_server === "true"){
			if(window.WebSocket){
				preparing = true;
			}
		}

		return preparing;
	},
	transportPrepared : function(){
		return wplc_transport_prepared;
	},
	asyncStorage : function(wplc_send_url, wplc_send_data, wplc_send_timeout){
		//Do nothing -> Ajax handles 
	},
	forceClosePort : function(){
		//Do Nothing ajax doesnt use socket ports
	},
	sendMessage : function(wplc_send_url, wplc_send_data, wplc_send_type, wplc_send_timeout, wplc_send_success_callback, wplc_send_fail_callback, wplc_send_complete_callback){
		WPLCServer.Ajax.send(wplc_send_url, wplc_send_data, wplc_send_type, wplc_send_timeout, wplc_send_success_callback, wplc_send_fail_callback, wplc_send_complete_callback);
	}
};


function wplc_server_log(msg){
	if(wplc_supress_server_logs !== true && window.console){
		console.log("WPLC SERVER: " + msg);
	}
}

function wplc_server_error(msg){
	if(window.console){
		console.error("WPLC SERVER ERROR: " + msg);
	}
}

function wplc_socket_send(data, success, fail, complete){
	if(wplc_node_port_open){
		wplc_socket_add_to_queue(data, success, fail, complete);

		//if(data.action !== "wplc_user_send_msg" && data.action !== "wplc_admin_send_msg"){
			var wplc_current_queue_item = wplc_socket_get_next_in_queue();
			if(wplc_current_queue_item !== false){
				if(typeof wplc_node_socket !== "undefined" && wplc_node_socket !== null){
					if(wplc_node_socket.readyState !== WebSocket.CONNECTING && wplc_node_socket.readyState !== WebSocket.CLOSING && wplc_node_socket.readyState !== WebSocket.CLOSED){
						wplc_current_queue_item.data.is_typing = typeof wplc_node_is_client_typing !== "undefined" ? wplc_node_is_client_typing : false;
						wplc_node_socket.send(JSON.stringify(wplc_current_queue_item.data));
						
						if(typeof wplc_current_queue_item.success === "function"){
							wplc_current_queue_item.success();	
						}
					} else {
						//Try again in a sec just now -> Add it to the queue
						setTimeout(function(){
							wplc_socket_send(data, success, fail, complete);	
						}, 500);
					}
				} else {
					setTimeout(function(){
						//Try again in a sec just now -> Add it to the queue
						wplc_socket_send(data, success, fail, complete);	
					}, 500);
				}
			}
		//}
	}
}

function wplc_socket_add_to_queue(data, success, fail, complete){
	if(typeof data.server_token === "undefined"){
		if(typeof wplc_node_token !== "undefined"){
			data.server_token = wplc_node_token;
		} else {
			wplc_server_error("No Server Token Present, Something will go wrong");
		}
	}


	var queue_item = {
		data: data,
		success: success,
		fail: fail,
		complete: complete
	}

	if(wplc_node_send_queue.length > 0){
		var last_item = wplc_node_send_queue[wplc_node_send_queue.length - 1];
		if(JSON.stringify(last_item.data) !== JSON.stringify(data)){
			wplc_node_send_queue.push(queue_item);
		}
	} else {
		wplc_node_send_queue.push(queue_item);
	}
}

function wplc_socket_get_next_in_queue(){
	if(wplc_node_send_queue.length > 0){
		return wplc_node_send_queue.shift();
	} else {
		return false;
	}
}

function wplc_socket_async_storage_handler(wplc_send_url, wplc_send_data, wplc_send_timeout){
	var wplc_node_ajax_action = "wplc_node_async_storage_ajax";
	//Send the data to the Async
	if(typeof wplc_restapi_enabled !== "undefined" && parseInt(wplc_restapi_enabled) === 1 && typeof wplc_restapi_endpoint !== "undefined"){
		//REST API is ready to rumble 
		wplc_send_url = wplc_restapi_endpoint + "/async_storage";
	} else {
		//Ajax time! Cause the Rest she Left
	}

	var prepared_data = {
		action : wplc_node_ajax_action,
		relay_action : wplc_send_data.action,
		chat_id : wplc_send_data.cid,
		security : wplc_send_data.security,
		messages : JSON.stringify(wplc_node_async_array),
        wplc_extra_data:document.wplc_extra_data
	};

	if(typeof wplc_node_token !== "undefined"){
		prepared_data.server_token = wplc_node_token;
	}

	wplc_node_async_array = new Array(); //Clearing the storage array before the next data can be sent through
	if(typeof Cookies !== "undefined" && typeof Cookies === "function"){
		Cookies.remove('wplc_server_async_storage'); //Clear the cookies now so that we don't do this again.
	}

	jQuery.ajax({
		url  : wplc_send_url,
		data : prepared_data,
		type : "POST",
		timeout : wplc_send_timeout,
		success : function(response){
			wplc_server_log("ASYNC STORAGE = SUCCESS");
		},
		error : function(error, exception){
			wplc_server_log("ASYNC STORAGE = FAIL");
		},
		complete : function(response){
			
		}
	});
}

function wplc_json_validator(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function wplc_node_parse_async_from_object(obj, complete){
	for(var i in obj){
		if(obj.hasOwnProperty(i)){
			wplc_node_async_array.push(obj[i]);
		}
	}

	if(typeof complete === "function"){
		complete();
	}
}

function wplc_node_global_message_receiver(data){
	if(data){
		if (typeof data !== "object") {
	        data = JSON.parse(data);    
	    }
	}

	if(typeof data['pair_name'] !== "undefined"){
		if(data['pair_name'] !== wplc_node_pair_name){
			wplc_node_pair_name = data['pair_name'];
		}
	}

	if(typeof data['pair_typing'] !== "undefined"){
		if(data['pair_typing'] === true || data['pair_typing'] === "true"){
			if(wplc_node_is_pair_typing_indicator_visible === false){
				if (jQuery("#wplc_user_typing").length>0) { } else {
                	jQuery(".typing_indicator").html("<span id='wplc_user_typing'>"+wplc_node_pair_name+" "+wplc_localized_string_is_typing+"</span>");
                	jQuery(".typing_indicator").addClass("typing_indicator_active");
                }
			}
			wplc_node_is_pair_typing_indicator_visible = true;
		} else {
			if(wplc_node_is_pair_typing_indicator_visible === true){
				if (jQuery("#wplc_user_typing").length>0) {
  		        	jQuery("#wplc_user_typing").fadeOut("slow").remove();
	                jQuery(".typing_indicator").removeClass("typing_indicator_active");
	  		    }
			}
			wplc_node_is_pair_typing_indicator_visible = false;
		}

	}
}

jQuery(function(){
	jQuery(document).ready(function(){
		var wplc_node_searchTimeout; 
		
		jQuery("body").on("keydown","#wplc_chatmsg, #wplc_admin_chatmsg", function(e) {
		    if(typeof wplc_node_sockets_ready !== "undefined" && wplc_node_sockets_ready === true){
		    	if(typeof wplc_node_is_client_typing !== "undefined"){
		  	  		if (e.which <= 90 && e.which >= 48) {
		  				if (wplc_node_is_client_typing) { 
		  					wplc_node_renew_typing();
		  					return; 
		  				}
		  				wplc_node_is_client_typing = true;
		  				
		  		        wplc_node_searchTimeout = setTimeout(wplc_node_clear_typing, 1000);
		  		    }
		  		}
		  	}
		});	

		function wplc_node_renew_typing() {
	    	clearTimeout(wplc_node_searchTimeout);
	    	wplc_node_searchTimeout = setTimeout(wplc_node_clear_typing, 1000);
	    }
	    function wplc_node_clear_typing() {
	    	wplc_node_is_client_typing = false;
	    	clearTimeout(wplc_node_searchTimeout);
	    }							
	});
});