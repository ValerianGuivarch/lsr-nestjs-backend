<?php
use MediaWiki\MediaWikiServices;
class PF2ReputationBridge {
 public static function isAdmin($user): bool {
  // The PF2 MJ role has its own dedicated Wiki permission. Avoid tying the
  // reputation editor to the unrelated ability to delete Wiki pages.
  return $user->isRegistered()
   && ($user->isAllowed('pf2sessions-admin') || $user->isAllowed('delete'));
 }
 public static function call($api,$method,$path,$body=null) {
  if($method!=='GET' && !self::isAdmin($api->getUser()))$api->dieWithError('Accès administrateur requis.');
  $services=MediaWikiServices::getInstance();
  $base=rtrim((string)$services->getMainConfig()->get('PF2PlayerCodexApiBase'),'/');
  $key=getenv('PF2_WIKI_LOGIN_INTERNAL_KEY') ?: getenv('PF2_JOURNALS_INTERNAL_KEY') ?: '';
  if(!$base || !$key)$api->dieWithError('API PF2 indisponible.');
  $query=$method==='GET' ? '?wikiUsername='.rawurlencode($api->getUser()->isRegistered()?$api->getUser()->getName():'') : '';
  $request=$services->getHttpRequestFactory()->create($base.'/reputations/internal'.$path.$query,['method'=>$method,'timeout'=>12,'postData'=>$body===null?null:json_encode($body)],__METHOD__);
  $request->setHeader('X-PF2-Wiki-Key',$key);
  $request->setHeader('X-PF2-Wiki-Admin', self::isAdmin($api->getUser()) ? '1' : '0');
  if($body!==null)$request->setHeader('Content-Type','application/json');
  $status=$request->execute();$result=json_decode($request->getContent(),true);
  if(!$status->isOK() || !is_array($result))$api->dieWithError('API des réputations indisponible.');
  return $result;
 }
}
