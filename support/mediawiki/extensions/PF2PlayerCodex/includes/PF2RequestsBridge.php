<?php
use MediaWiki\MediaWikiServices;
class PF2RequestsBridge {
 public static function requireEditor($api) {
  if (!$api->getUser()->isRegistered()) $api->dieWithError('Connectez-vous pour modifier les requêtes.');
 }
 public static function call($api,$method,$path,$body=null) {
  if ($method !== 'GET') self::requireEditor($api);
  $services=MediaWikiServices::getInstance();
  $base=rtrim((string)$services->getMainConfig()->get('PF2PlayerCodexApiBase'),'/');
  $key=getenv('PF2_WIKI_LOGIN_INTERNAL_KEY') ?: getenv('PF2_JOURNALS_INTERNAL_KEY') ?: '';
  if (!$base || !$key) $api->dieWithError('API PF2 indisponible.');
  $request=$services->getHttpRequestFactory()->create($base.'/requests/internal'.$path,[
   'method'=>$method,'timeout'=>12,
   'postData'=>$body===null?null:json_encode($body)
  ],__METHOD__);
  $request->setHeader('X-PF2-Wiki-Key',$key);
  if ($body!==null) $request->setHeader('Content-Type','application/json');
  $status=$request->execute();
  $result=json_decode($request->getContent(),true);
  if (!$status->isOK() || !is_array($result)) $api->dieWithError('Synchronisation des requêtes indisponible.');
  return $result;
 }
}
