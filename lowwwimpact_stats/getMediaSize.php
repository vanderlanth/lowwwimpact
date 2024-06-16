<?php
$url = $_SERVER['REQUEST_URI'];
$parts = parse_url($url);

parse_str($parts['query'], $query);
echo filesize('../'.$query['url']);
?>