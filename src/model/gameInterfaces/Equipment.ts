import Armor from "./Armor";
import EpicAbility from "./EpicAbility";
import Item from "./Item";

import Weapon from "./Weapon";

export default interface Equipment {
  weapons: Weapon[];
  armors: Armor[];
  items: Item[];
  epicAbility: EpicAbility;
}
