<?php
class ApiPF2Horoscopes extends ApiBase {
 public function execute() {
  if (!$this->getUser()->isRegistered()) $this->dieWithError('Connexion requise.');
  $p=$this->extractRequestParams();
  $this->getResult()->addValue(null,'pf2horoscopes',$this->proxy($p['npcId'],'GET'));
 }
 protected function proxy(string $npcId,string $method,array $body=[]) {
  $services=MediaWiki\MediaWikiServices::getInstance();
  $base=rtrim((string)$services->getMainConfig()->get('PF2PlayerCodexApiBase'),'/');
  $key=getenv('PF2_WIKI_LOGIN_INTERNAL_KEY') ?: getenv('PF2_JOURNALS_INTERNAL_KEY') ?: '';
  if (!$base || !$key) $this->dieWithError('API PF2 indisponible.');
  $user=$this->getUser();
  $url=$base.'/horoscopes/internal/'.rawurlencode($npcId);
  if ($method==='GET') $url.='?wikiUsername='.rawurlencode($user->getName());
  else $body['wikiUsername']=$user->getName();
  $req=$services->getHttpRequestFactory()->create($url,[
   'method'=>$method,'timeout'=>12,'postData'=>$method==='GET'?null:json_encode($body)
  ],__METHOD__);
  $req->setHeader('X-PF2-Wiki-Key',$key);
  $req->setHeader('X-PF2-Wiki-Admin',$user->isAllowed('delete')?'1':'0');
  if ($method!=='GET') $req->setHeader('Content-Type','application/json');
  $status=$req->execute();
  $data=json_decode($req->getContent(),true);
  if (!$status->isOK() || !is_array($data) || !isset($data['horoscopes'])) $this->dieWithError('Horoscope indisponible ou accès refusé.');
  return $data;
 }
 public function getAllowedParams(){return ['npcId'=>[self::PARAM_TYPE=>'string',self::PARAM_REQUIRED=>true]];}
 public function isReadMode(){return true;}
}
