<?php
/**
 * Funciones y enrutador principal del tema Perú Conchuela.
 *
 * Carga las 4 páginas HTML (html/index.html, html/avicola.html,
 * html/prensa.html y html/libro-reclamaciones.html) adaptando
 * automáticamente todas las rutas de recursos (assets/, css/, js/)
 * y enlaces internos a la instalación activa de WordPress.
 *
 * @package Peru_Conchuela
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Mapa de páginas disponibles en la carpeta html/.
 *
 * @return array<string, string>
 */
function peru_conchuela_get_pages_map() {
	return array(
		'index'               => 'index.html',
		'avicola'             => 'avicola.html',
		'prensa'              => 'prensa.html',
		'libro-reclamaciones' => 'libro-reclamaciones.html',
	);
}

/**
 * Determina qué página del sitio se está solicitando según la URL o query de WordPress.
 *
 * @return string|null Clave de página ('index', 'avicola', 'prensa', 'libro-reclamaciones') o null si es ruta interna de WP.
 */
function peru_conchuela_resolve_requested_slug() {
	if ( is_admin() || wp_doing_ajax() || wp_doing_cron() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
		return null;
	}

	// 1. Parámetro explícito ?pagina=avicola (compatible con enlaces permanentes simples)
	if ( isset( $_GET['pagina'] ) ) {
		$param = sanitize_key( wp_unslash( $_GET['pagina'] ) );
		$map   = peru_conchuela_get_pages_map();
		if ( isset( $map[ $param ] ) ) {
			return $param;
		}
	}

	// 2. Ruta de la URL solicitada (/avicola, /avicola.html, /prensa, /libro-reclamaciones, /)
	$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '/';
	$path        = (string) wp_parse_url( $request_uri, PHP_URL_PATH );

	// Descontar subdirectorio si WordPress está instalado en una subcarpeta
	$home_path = (string) wp_parse_url( home_url( '/' ), PHP_URL_PATH );
	if ( $home_path && '/' !== $home_path && 0 === strpos( $path, $home_path ) ) {
		$path = substr( $path, strlen( $home_path ) );
	}

	$clean_path = trim( $path, '/' );
	$clean_slug = strtolower( preg_replace( '/\.html$/i', '', $clean_path ) );

	// No interceptar rutas nativas de WordPress
	if ( preg_match( '#^(wp-admin|wp-login\.php|wp-json|wp-content|wp-includes|xmlrpc\.php|feed|sitemap\.xml|robots\.txt)#i', $clean_path ) ) {
		return null;
	}

	if ( '' === $clean_slug || 'index' === $clean_slug || 'inicio' === $clean_slug ) {
		return 'index';
	}

	$map = peru_conchuela_get_pages_map();
	if ( isset( $map[ $clean_slug ] ) ) {
		return $clean_slug;
	}

	// 3. Si es una página creada en el editor de WordPress con slug conocido
	if ( is_singular( 'page' ) ) {
		$post = get_queried_object();
		if ( $post && ! empty( $post->post_name ) && isset( $map[ $post->post_name ] ) ) {
			return $post->post_name;
		}
	}

	if ( is_front_page() || is_home() ) {
		return 'index';
	}

	return null;
}

/**
 * Construye la URL pública hacia una página interna según la estructura de enlaces permanentes.
 *
 * @param string $slug Slug de la página ('avicola', 'prensa', 'libro-reclamaciones').
 * @return string
 */
function peru_conchuela_get_page_url( $slug ) {
	if ( 'index' === $slug ) {
		return home_url( '/' );
	}
	if ( get_option( 'permalink_structure' ) ) {
		return home_url( '/' . trim( $slug, '/' ) . '/' );
	}
	return add_query_arg( 'pagina', $slug, home_url( '/' ) );
}

/**
 * Lee el archivo HTML desde html/ y adapta todas sus rutas al entorno de WordPress.
 *
 * @param string $slug Clave de página ('index', 'avicola', 'prensa', 'libro-reclamaciones').
 * @return void
 */
function peru_conchuela_render_page( $slug ) {
	$map      = peru_conchuela_get_pages_map();
	$filename = isset( $map[ $slug ] ) ? $map[ $slug ] : 'index.html';

	$file_path = get_stylesheet_directory() . '/html/' . $filename;
	if ( ! file_exists( $file_path ) ) {
		$file_path = get_stylesheet_directory() . '/' . $filename;
	}

	if ( ! file_exists( $file_path ) ) {
		status_header( 404 );
		echo '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Página no encontrada</title></head><body><p>Archivo de plantilla no encontrado: ' . esc_html( $filename ) . '</p></body></html>';
		exit;
	}

	// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
	$html = file_get_contents( $file_path );
	if ( false === $html ) {
		exit;
	}

	$theme_uri = trailingslashit( get_stylesheet_directory_uri() );
	$home_url  = trailingslashit( home_url( '/' ) );

	// Si se instaló la versión ligera del tema (sin carpeta assets/video local para superar límites de 2MB/8MB en PHP),
	// sirve los 3 videos automáticamente desde el CDN del repositorio oficial.
	$has_local_videos = file_exists( get_stylesheet_directory() . '/assets/video/scroll-video.mp4' );
	$video_base_uri   = $has_local_videos
		? $theme_uri . 'assets/video/'
		: 'https://raw.githubusercontent.com/FabrizeOo/per-conchuela/main/assets/video/';

	$avicola_url = peru_conchuela_get_page_url( 'avicola' );
	$prensa_url  = peru_conchuela_get_page_url( 'prensa' );
	$libro_url   = peru_conchuela_get_page_url( 'libro-reclamaciones' );

	// 1. Adaptar rutas de recursos estáticos (assets/, css/, js/) hacia la carpeta del tema en WordPress
	$asset_replacements = array(
		'="assets/video/'    => '="' . $video_base_uri,
		'="../assets/video/' => '="' . $video_base_uri,
		'="assets/'          => '="' . $theme_uri . 'assets/',
		'="../assets/'       => '="' . $theme_uri . 'assets/',
		'="css/'             => '="' . $theme_uri . 'css/',
		'="../css/'          => '="' . $theme_uri . 'css/',
		'="js/'              => '="' . $theme_uri . 'js/',
		'="../js/'           => '="' . $theme_uri . 'js/',
	);
	$html = strtr( $html, $asset_replacements );

	// 2. Adaptar enlaces de navegación entre las 4 páginas (incluyendo anclas #contacto, #inicio, etc.)
	$link_replacements = array(
		'href="index.html#'              => 'href="' . $home_url . '#',
		'href="index.html"'              => 'href="' . $home_url . '"',
		'href="avicola.html#'            => 'href="' . $avicola_url . '#',
		'href="avicola.html"'            => 'href="' . $avicola_url . '"',
		'href="prensa.html#'             => 'href="' . $prensa_url . '#',
		'href="prensa.html"'             => 'href="' . $prensa_url . '"',
		'href="libro-reclamaciones.html#' => 'href="' . $libro_url . '#',
		'href="libro-reclamaciones.html"' => 'href="' . $libro_url . '"',
	);
	$html = strtr( $html, $link_replacements );

	// 3. En WordPress, retirar la etiqueta meta CSP estática para no bloquear el Personalizador (Vista previa en vivo), barra de administración ni plugins de WordPress
	$html = preg_replace( '/<meta[^>]+http-equiv=["\']Content-Security-Policy["\'][^>]*>\s*/i', '', $html );

	if ( ! headers_sent() ) {
		status_header( 200 );
		header( 'Content-Type: text/html; charset=UTF-8' );
	}

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo $html;
	exit;
}

/**
 * Intercepta las peticiones del frontend para servir las páginas HTML del tema.
 */
function peru_conchuela_template_redirect() {
	$slug = peru_conchuela_resolve_requested_slug();
	if ( null !== $slug ) {
		peru_conchuela_render_page( $slug );
	}
}
add_action( 'template_redirect', 'peru_conchuela_template_redirect', 1 );

/**
 * Crea automáticamente las páginas internas en WordPress al activar el tema
 * para que aparezcan en el panel Páginas y funcionen las URLs amigables.
 */
function peru_conchuela_setup_pages() {
	$pages = array(
		'avicola'             => 'Sector Avícola',
		'prensa'              => 'Prensa',
		'libro-reclamaciones' => 'Libro de Reclamaciones',
	);

	foreach ( $pages as $slug => $title ) {
		$existing = get_page_by_path( $slug );
		if ( ! $existing ) {
			wp_insert_post(
				array(
					'post_title'   => $title,
					'post_name'    => $slug,
					'post_status'  => 'publish',
					'post_type'    => 'page',
					'post_content' => '<!-- Página renderizada automáticamente por el tema Perú Conchuela (html/' . $slug . '.html) -->',
				)
			);
		}
	}

	flush_rewrite_rules();
}
add_action( 'after_switch_theme', 'peru_conchuela_setup_pages' );

/**
 * Soporte básico del tema en WordPress.
 */
function peru_conchuela_theme_support() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'html5', array( 'search-form', 'gallery', 'caption', 'style', 'script' ) );
}
add_action( 'after_setup_theme', 'peru_conchuela_theme_support' );

