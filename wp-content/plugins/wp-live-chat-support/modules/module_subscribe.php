<?php
/**
 * Plugin action links filter
 *
 * @param array   $links
 * @return array
 */
add_filter( 'network_admin_plugin_action_links_wp-live-chat-support/wp-live-chat-support.php', 'wplc_plugin_action_links' );
add_filter( 'plugin_action_links_wp-live-chat-support/wp-live-chat-support.php', 'wplc_plugin_action_links' );
function wplc_plugin_action_links( $links ) {
    
    array_unshift( $links,
        '<a class="edit" href="' . admin_url('edit.php?post_type=contact-forms-nd&page=wpcf-settings') . '">' . __( 'Settings', 'wplivechat' ) . '</a>' );
    array_unshift( $links,
        '<a class="" target="_BLANK" href="http://www.contactformready.com/extensions/?utm_source=plugin&utm_medium=link&utm_campaign=extensions">' . __( 'Extensions', 'wplivechat' ) . '</a>' );


    return $links;
}

add_action( 'wp_ajax_wplc_subscribe','wplc_ajax_subscribe');

function wplc_ajax_subscribe() {
    $check = check_ajax_referer( 'wplc_subscribe', 'security' );
    if ( $check == 1 ) {
        if ( $_POST['action'] == 'wplc_subscribe' ) {
            $uid = get_current_user_id();
            update_user_meta( $uid, 'wplc_subscribed', true);

        }
    }
}

add_action ( 'admin_head', 'wplc_plugin_row_js' );
function wplc_plugin_row_js(){
    $current_page = get_current_screen();

    if ( $current_page->base == 'plugins' ) {
        wp_register_script( 'wplc_plugin_row_js', plugins_url(plugin_basename(dirname(dirname(__FILE__)))).'/js/wplc_plugin_row.js', array( 'jquery-ui-core' ) );
        wp_enqueue_script( 'wplc_plugin_row_js' );
        wp_localize_script( 'wplc_plugin_row_js', 'wplc_sub_nonce', wp_create_nonce("wplc_subscribe") );
    }
}


/**
 * Adds the email subscription field below the plugin row on the plugins page
 * 
 */
add_filter( 'plugin_row_meta', 'wplc_plugin_row', 4, 10 );
function wplc_plugin_row( $plugin_meta, $plugin_file, $plugin_data, $status ) {

    if ( $plugin_file == "wp-live-chat-support/wp-live-chat-support.php") {
        $check = get_user_meta(get_current_user_id(),"wplc_subscribed");
        
        $wplc_current_user = get_current_user_id();
        
        if ( isset( $current_user->data ) && isset( $current_user->data->user_email ) ) {
            $user_email = $current_user->data->user_email;
            if (!$user_email || $user_email == '') {
                $user_email = get_option( 'admin_email' );
            }
        } else {
            $user_email = get_option( 'admin_email' );
        }

        if (!$check) {
            $ret = '<div style="margin-top:10px; color:#333; display:block; white-space:normal;">';
            $ret .= '<form>';
            $ret .= '<p><label for="wplc_signup_newsletter" style="font-style:italic; margin-bottom:5px;">' . __( 'Sign up to our newsletter and get information on the latest updates, beta versions and specials.', 'wplivechat' ) . '</label></p>';
            $ret .= '<span id="wplc_subscribe_div">';
            $ret .= '<input type="text" name="wplc_signup_newsletter" id="wplc_signup_newsletter" value="'. $user_email .'"></option>';
            $ret .= '<input type="button" class="button button-primary"  id="wplc_signup_newsletter_btn" name="wplc_signup_newsletter_btn" value="' . __( 'Sign up', 'wplivechat' ) . '" />';
            $ret .= '<span>';
            $ret .= '</form>';
            $ret .= '</div>';
            array_push( $plugin_meta, $ret );
        }
    }
    return $plugin_meta;
}