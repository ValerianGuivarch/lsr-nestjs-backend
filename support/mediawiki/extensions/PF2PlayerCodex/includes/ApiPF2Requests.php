<?php
class ApiPF2Requests extends ApiBase {
 public function execute() {
  $items=PF2RequestsBridge::call($this,'GET','');
  $this->getResult()->addValue(null,'pf2requests',$items);
 }
 public function isReadMode() {return true;}
}
