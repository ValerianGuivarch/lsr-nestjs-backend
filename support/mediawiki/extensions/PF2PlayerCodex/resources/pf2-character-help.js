(function () {
    'use strict';
    var fields = [
        ['howToPlay', 'Comment le jouer', 1700],
        ['nextLevel', 'Faire son prochain niveau', 1700],
        ['progression', 'Comment progresser', 16000]
    ];
    var api = function () { return new mw.Api(); };
    var notifyError = function (error) {
        mw.notify(error && error.error && error.error.info || 'Enregistrement impossible.', { type: 'error' });
    };
    window.pf2RenderCharacterHelp = function (panel, character, isMjAdmin) {
        panel.textContent = 'Chargement de l’aide…';
        api().get({ action: 'pf2characterhelp', npcId: character.npcId, format: 'json' }).then(function (response) {
            var help = response.pf2characterhelp;
            panel.textContent = '';
            var status = document.createElement('p');
            if (help.currentLevel === null || help.theoreticalLevel === null) {
                status.textContent = 'Niveau actuel indisponible : vérifier la dernière synchronisation Foundry.';
            } else {
                status.textContent = 'Niveau sur Foundry : ' + help.currentLevel
                    + ' · Niveau acquis : ' + help.theoreticalLevel
                    + (help.pendingLevelUp ? ' · Niveau à faire !' : ' · À jour');
            }
            status.className = 'pf2-player-help-status';
            panel.appendChild(status);

            function renderSection(field, title, maxLength) {
                var section = document.createElement('section');
                section.className = 'pf2-player-help-section';
                var heading = document.createElement('h3');
                heading.textContent = title;
                section.appendChild(heading);
                var view = document.createElement('div');
                view.className = 'pf2-player-help-content';
                function showText() {
                    view.textContent = help[field] || 'Cette section sera préparée avec le MJ.';
                }
                showText();
                section.appendChild(view);
                if (isMjAdmin && help.canEdit) {
                    var edit = document.createElement('button');
                    edit.type = 'button';
                    edit.textContent = 'Modifier';
                    section.appendChild(edit);
                    edit.onclick = function () {
                        var textarea = document.createElement('textarea');
                        textarea.rows = field === 'progression' ? 15 : 9;
                        textarea.maxLength = maxLength;
                        textarea.value = help[field] || '';
                        textarea.className = 'pf2-player-help-editor';
                        var save = document.createElement('button');
                        save.textContent = 'Enregistrer';
                        save.className = 'pf2-player-primary';
                        var cancel = document.createElement('button');
                        cancel.textContent = 'Annuler';
                        view.hidden = true;
                        edit.hidden = true;
                        section.insertBefore(textarea, edit);
                        section.insertBefore(save, edit);
                        section.insertBefore(cancel, edit);
                        cancel.onclick = function () {
                            textarea.remove(); save.remove(); cancel.remove(); view.hidden = false; edit.hidden = false;
                        };
                        save.onclick = function () {
                            save.disabled = true;
                            api().postWithToken('csrf', {
                                action: 'pf2characterhelpupdate', npcId: character.npcId,
                                field: field, content: textarea.value, format: 'json'
                            }).then(function (result) {
                                help = result.pf2characterhelpupdate;
                                showText();
                                cancel.onclick();
                                mw.notify('Aide enregistrée.', { type: 'success' });
                            }).catch(function (error) { save.disabled = false; notifyError(error); });
                        };
                    };
                }
                panel.appendChild(section);
            }
            fields.forEach(function (spec) { renderSection(spec[0], spec[1], spec[2]); });
            var target = document.createElement('div');
            target.className = 'pf2-player-help-target';
            var label = document.createElement('strong');
            label.textContent = 'Niveau concerné par la section « Faire son prochain niveau » : ';
            target.appendChild(label);
            var value = document.createElement('span');
            value.textContent = help.nextLevelFor || 'À préciser';
            target.appendChild(value);
            if (isMjAdmin && help.canEdit) {
                var editTarget = document.createElement('button');
                editTarget.textContent = 'Modifier';
                target.appendChild(editTarget);
                editTarget.onclick = function () {
                    var input = document.createElement('input');
                    input.type = 'number'; input.min = 2; input.max = 20;
                    input.value = help.nextLevelFor || '';
                    input.placeholder = '2 à 20';
                    var save = document.createElement('button');
                    save.textContent = 'Enregistrer';
                    var cancel = document.createElement('button');
                    cancel.textContent = 'Annuler';
                    value.hidden = true; editTarget.hidden = true;
                    target.appendChild(input); target.appendChild(save); target.appendChild(cancel);
                    cancel.onclick = function () {
                        input.remove(); save.remove(); cancel.remove(); value.hidden = false; editTarget.hidden = false;
                    };
                    save.onclick = function () {
                        var number = input.value === '' ? '' : Number(input.value);
                        if (number !== '' && (!Number.isInteger(number) || number < 2 || number > 20)) {
                            mw.notify('Indique un niveau entre 2 et 20.', { type: 'error' }); return;
                        }
                        save.disabled = true;
                        api().postWithToken('csrf', { action: 'pf2characterhelpupdate',
                            npcId: character.npcId, field: 'nextLevelFor',
                            content: String(number), format: 'json'
                        }).then(function (result) {
                            help = result.pf2characterhelpupdate;
                            value.textContent = help.nextLevelFor || 'À préciser';
                            cancel.onclick();
                            mw.notify('Niveau cible enregistré.', { type: 'success' });
                        }).catch(function (error) { save.disabled = false; notifyError(error); });
                    };
                };
            }
            // Keep the target directly after the next-level section.
            panel.insertBefore(target, panel.children[2].nextSibling);
        }).catch(function () {
            panel.textContent = 'Aide indisponible ou accès refusé.';
        });
    };
}());
