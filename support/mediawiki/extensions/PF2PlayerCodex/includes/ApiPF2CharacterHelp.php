<?php

use MediaWiki\MediaWikiServices;

class ApiPF2CharacterHelp extends ApiBase {
    protected function proxy(string $npcId, string $method, array $body = []): array {
        $user = $this->getUser();
        if (!$user->isRegistered()) $this->dieWithError('Connexion requise.');
        if ($method !== 'GET' && !$user->isAllowed('delete')) $this->dieWithError('Réservé au MJ.');
        $services = MediaWikiServices::getInstance();
        $base = rtrim((string)$services->getMainConfig()->get('PF2PlayerCodexApiBase'), '/');
        $key = getenv('PF2_WIKI_LOGIN_INTERNAL_KEY') ?: getenv('PF2_JOURNALS_INTERNAL_KEY') ?: '';
        if ($base === '' || $key === '') $this->dieWithError('Service PF2 non configuré.');
        $params = [
            'wikiUsername' => $user->getName(), 'npcId' => $npcId,
            'wikiIsAdmin' => $user->isAllowed('delete') ? '1' : '0'
        ];
        $url = $base . '/player-codex/me/help';
        $options = [ 'method' => $method, 'timeout' => 12 ];
        if ($method === 'GET') $url .= '?' . http_build_query($params);
        else {
            $body['wikiUsername'] = $user->getName();
            $body['npcId'] = $npcId;
            $body['wikiIsAdmin'] = $user->isAllowed('delete');
            $options['postData'] = json_encode($body);
        }
        $req = $services->getHttpRequestFactory()->create($url, $options, __METHOD__);
        $req->setHeader('X-PF2-Wiki-Key', $key);
        if ($method !== 'GET') $req->setHeader('Content-Type', 'application/json');
        $status = $req->execute();
        $data = json_decode($req->getContent(), true);
        if (!$status->isOK() || !is_array($data) || isset($data['statusCode'])) {
            $this->dieWithError('Aide inaccessible ou service PF2 indisponible.');
        }
        return $data;
    }
    public function execute() {
        $params = $this->extractRequestParams();
        $npcId = trim($params['npcId']);
        if ($npcId === '') $this->dieWithError('Personnage manquant.');
        $this->getResult()->addValue(null, 'pf2characterhelp', $this->proxy($npcId, 'GET'));
    }
    public function getAllowedParams() {
        return [ 'npcId' => [ self::PARAM_TYPE => 'string', self::PARAM_REQUIRED => true ] ];
    }
    public function isReadMode() { return true; }
}
