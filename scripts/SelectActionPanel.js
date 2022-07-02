import { moduleName, impactMap, localize } from "./main.js";

export class SelectActionPanel extends Application {
    constructor(combatant, combat) {
        super();

        this.combatant = combatant;
        this.combat = combat;
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: `${moduleName}-select-action-panel`,
            minimizable: false,
            template: `/modules/${moduleName}/templates/selectActionPanel.hbs`,
            //resizable: true,
            width: 550,
            height: 420,
        });
    }

    get title() {
        return `Select Action: ${this.combatant.name}`; // LOCALIZE
    }

    getData() {
        //console.log(this.combatant);
        //console.log(this.combat);

        const data = {};
        data.moduleName = moduleName;
        
        // Populate combatants to target
        const combatants = this.combat.combatants.filter(c => {
            if (c.id === this.combatant.id) return false; // Filter out current combatant
            if (c.hidden && !game.user.isGM) return false; // Filter out hidden combatants if current user is not a GM
            
            return true;
        });
        combatants.unshift(this.combat.combatants.find(c => c.id === this.combatant.id)); // Add current combatant to start of list
        const currentTarget = this.combatant.getFlag(moduleName, "action.target");
        data.combatants = combatants;
        if (currentTarget) data.currentTarget = currentTarget;

        // Populate skills using Feature-type items on character
        data.skills = [];
        const skillItems = this.combatant.actor.items.filter(i => i.type === "feat" && i.data.flags[moduleName]);
        for (const item of skillItems) {
            const { img, name } = item;
            data.skills.push({
                img,
                name,
                type: item.data.flags[moduleName].type,
                impact: impactMap[item.data.flags[moduleName].type],
                effect: item.data.flags[moduleName].effect
            });
        }

        const currentSkill = this.combatant.getFlag(moduleName, "action.skill");
        if (currentSkill) data.currentSkill = currentSkill;

        // Populate skill options // LOCALIZE
        /*       
        const skills = ["Punch", "Block", "Dash", "Recon", "Drain", "Pain", "Bane", "Sane"];
        data.skills = skills.reduce((acc, current) => {
            acc[current] = current;
            return acc;
        }, {});
        const currentSkill = this.combatant.getFlag(moduleName, "action.skill");
        if (currentSkill) data.currentSkill = currentSkill;
        */

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html[0].querySelectorAll(`img.token-icon`).forEach(n => {
            n.addEventListener("mouseenter", ev => this.hoverIn(ev));
            n.addEventListener("mouseleave", ev => this.hoverOut(ev));

            n.addEventListener("click", ev => this.targetSelect(ev));
        });
        
        html[2].querySelector(`button[name="confirm"]`).addEventListener("click", () => this.submitAction());
        html[2].querySelector(`button[name="clear"]`).addEventListener("click", () => this.clearAction());
        html[2].querySelector(`button[name="cancel"]`).addEventListener("click", () => this.close());
    }

    hoverIn(event) {
        CombatTracker.prototype._onCombatantHoverIn.call(ui.combat, event);
    }

    hoverOut(event) {
        CombatTracker.prototype._onCombatantHoverOut.call(ui.combat, event);
    }

    targetSelect(event) {
        this.element[0].querySelectorAll(`img.token-icon`).forEach(n => n.classList.remove("selected"));
        const tokenIcon = event.currentTarget;
        tokenIcon.classList.add("selected");
    }

    async submitAction() {
        const html = this.element[0];

        const targetID = html.querySelector(`img.token-icon.selected`)?.dataset.combatantId;
        if (!targetID) ui.notifications.warn(localize("WarnTarget"));

        const selectedSkill = html.querySelector(`input[name="skills"]:checked`)?.value;
        if (!selectedSkill) ui.notifications.warn(localize("WarnSkill"));
        
        if (!selectedSkill || !targetID) return;

        await this.combatant.setFlag(moduleName, "action", {
            target: targetID,
            skill: selectedSkill
        });
        this.close();
    }

    async clearAction() {
        await this.combatant.unsetFlag(moduleName, "action");
        //this.render();
        this.close();
    }

}