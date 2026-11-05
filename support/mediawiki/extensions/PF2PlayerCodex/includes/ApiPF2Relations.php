<?php
class ApiPF2Relations extends ApiBase {
 public function execute() {
  $user=$this->getUser();
  if(!$user->isRegistered())$this->dieWithError('Connexion requise.');
  $p=$this->extractRequestParams();
  $npcId=trim($p['npcId']);
  if($npcId==='')$this->dieWithError('Personnage manquant.');
  $data=$this->proxy($npcId,'GET');
  $this->getResult()->addValue(null,'pf2relations',['relations'=>$data]);
 }
 public function proxy(string $npcId,string $method,array $body=[]){
  $services=MediaWiki\MediaWikiServices::getInstance();
  $base=rtrim((string)$services->getMainConfig()->get('PF2PlayerCodexApiBase'),'/');
  $key=getenv('PF2_WIKI_LOGIN_INTERNAL_KEY') ?: getenv('PF2_JOURNALS_INTERNAL_KEY') ?: '';
  if(!$base||!$key)$this->dieWithError('API PF2 indisponible.');
  $admin=$this->getUser()->isAllowed('delete');
  if($method!=='GET' && !$admin)$this->dieWithError('Réservé au MJ.');
  $url=$base.'/relations/internal/'.rawurlencode($npcId);
  if($method==='GET')$url.='?wikiUsername='.rawurlencode($this->getUser()->getName());
  if($method!=='GET')$body['wikiUsername']=$this->getUser()->getName();
  $req=$services->getHttpRequestFactory()->create($url,[
   'method'=>$method,'timeout'=>12,'postData'=>$method==='GET'?null:json_encode($body)
  ],__METHOD__);
  $req->setHeader('X-PF2-Wiki-Key',$key);
  $req->setHeader('X-PF2-Wiki-Admin',$admin?'1':'0');
  if($method!=='GET')$req->setHeader('Content-Type','application/json');
  $status=$req->execute();
  $data=json_decode($req->getContent(),true);
  if(!$status->isOK()||!is_array($data))$this->dieWithError('API Relations indisponible.');
  return $data;
 }
 public function getAllowedParams(){return ['npcId'=>[self::PARAM_TYPE=>'string',self::PARAM_REQUIRED=>true]];}
 public function isReadMode(){return true;}
}
