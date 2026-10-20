<?php
use MediaWiki\MediaWikiServices;
class PF2ReputationBridge {
 public static function isAdmin($user): bool {return $user->isRegistered() && $user->isAllowed('delete');}
 public static function call($api,$method,$path,$body=null) {
  if($method!=='GET' && !self::isAdmin($api->getUser()))$api->dieWithError('Accès administrateur requis.');
  $services=MediaWikiServices::getInstance();
  $base=rtrim((string)$services->getMainConfig()->get('PF2PlayerCodexApiBase'),'/');
  $key=getenv('PF2_WIKI_LOGIN_INTERNAL_KEY') ?: getenv('PF2_JOURNALS_INTERNAL_KEY') ?: '';
  if(!$base || !$key)$api->dieWithError('API PF2 indisponible.');
  $request=$services->getHttpRequestFactory()->create($base.'/reputations/internal'.$path,['method'=>$method,'timeout'=>12,'postData'=>$body===null?null:json_encode($body)],__METHOD__);
  $request->setHeader('X-PF2-Wiki-Key',$key);
  if($body!==null)$request->setHeader('Content-Type','application/json');
  $status=$request->execute();$result=json_decode($request->getContent(),true);
  if(!$status->isOK() || !is_array($result))$api->dieWithError('API des réputations indisponible.');
  return $result;
 }
}
