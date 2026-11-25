<?php

class ApiPF2CharacterHelpUpdate extends ApiPF2CharacterHelp {
    public function execute() {
        if (!$this->getUser()->isRegistered() || !$this->getUser()->isAllowed('delete')) {
            $this->dieWithError('Rédaction réservée au MJ.');
        }
        $params = $this->extractRequestParams();
        $field = $params['field'];
        $value = $field === 'nextLevelFor'
            ? ($params['content'] === '' ? null : (int)$params['content'])
            : $params['content'];
        $data = $this->proxy(trim($params['npcId']), 'POST', [ 'field' => $field, 'value' => $value ]);
        $this->getResult()->addValue(null, 'pf2characterhelpupdate', $data);
    }
    public function getAllowedParams() {
        return [
            'npcId' => [ self::PARAM_TYPE => 'string', self::PARAM_REQUIRED => true ],
            'field' => [ self::PARAM_TYPE => ['howToPlay', 'nextLevel', 'progression', 'nextLevelFor'], self::PARAM_REQUIRED => true ],
            'content' => [ self::PARAM_TYPE => 'string', self::PARAM_DFLT => '' ],
        ];
    }
    public function needsToken() { return 'csrf'; }
    public function mustBePosted() { return true; }
    public function isWriteMode() { return true; }
}
