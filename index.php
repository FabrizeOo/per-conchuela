<?php
/**
 * Plantilla principal del tema Perú Conchuela.
 *
 * WordPress utiliza este archivo como punto de entrada de plantilla.
 * Delega el renderizado hacia functions.php (peru_conchuela_render_page).
 *
 * @package Peru_Conchuela
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$peru_conchuela_slug = function_exists( 'peru_conchuela_resolve_requested_slug' )
	? peru_conchuela_resolve_requested_slug()
	: 'index';

if ( function_exists( 'peru_conchuela_render_page' ) ) {
	peru_conchuela_render_page( $peru_conchuela_slug ? $peru_conchuela_slug : 'index' );
}

