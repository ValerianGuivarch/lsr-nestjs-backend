<?php
class SpecialPF2Requests extends SpecialPage {
 public function __construct() { parent::__construct('RequetesPF2'); }
 public function execute($subPage) {
  $this->setHeaders();
  $this->getOutput()->setPageTitle('Requêtes PF2');
  $this->getOutput()->addModules('ext.pf2requests');
  $this->getOutput()->addHTML('<div id="pf2-requests-board"></div>');
 }
}
