/**
 * Markdown File Loader for Long Island Case Investigation
 * 
 * This module provides access to the actual markdown content from 
 * src/data/The Long Island Case/ directory
 */

// Real markdown content from the investigation files
export const markdownContentMap: Record<string, string> = {
  'People/Stephanie Mininni.md': `34 Years Old

Stephanie.Killeen.39
@truarkga39x

Stephanie Mininni claims she was "Molested, Groomed and Trafficked" _and is now trauma responding to awakening repressed memories._

Stephanie posted 6 videos talking about what's been going on
1. When Steph did her post on Facebook on June 20th, [[James Puchett]] put the "Laughing" reaction to it!!!

Claims she was "Manipulated to make suicide videos"
she was on **Suboxone** (claims of relapse... but relapse isn't possible with **Suboxone**)

Went to the #5thPrecinct [[Suffolk County Police Department]] to report after making her videos.
After she went back home and was *(captured?)* taken to the Hospital [[CPEP]]?

#Mininni #whistleblower

[[Patchogue]] [[Long Island, NY]] 

- [[Anthony Killeen]] is a nurse at [[Stony Brook]]- that is where Stephanie was brought for emergency psych. *"He has the ability to not only access her medical records but I am sure has some influence on those who provided her treatment."* 
- Stephanie was ***not*** brought to Stony Brook from the police. 
- #5thPrecinct[[Suffolk County Police Department]] took her statement and stated they'll investigate. Her mother called called the cops later that day with false accusations. 
- Stephanie agreed to go to the hospital because she wanted to prove she was not on drugs. Her toxicology report was clean at [[Stony Brook Hospital]]

*Still no posts online from Stephanie...*

[[Nicholas Tedesco]] claims friendship and that they met together in [[CPEP]] and that Stephanie gave him a letter... [[Ian Killeen]] talks about "receiving" such letters... did [[Nicholas Tedesco]] get that letter from [[Ian Killeen]]? 


**Calls out:**
Brother: [[Steven Mininni]]
Mother: [[Patricia Mininni]] *(Molested both [[Steven Mininni]] and Stephanie Mininni)*
Father: [[Alfred J Mininni]] *(Mafia Boss - Mob Boss)* *("They were murdered"... Who else??? Another family? Did Alfred have another family?)*

**Calls out:**
Husband: [[Ian Killeen]]
[[Linda Gulli Killeen]]
[[Anthony Killeen]]

"These two families have been working together this whole time"
#Mininni #Killeen 

She was advised not to make a TikTok Video
She Completely Agrees to go to a Police Station
She has been a Drug Addict since a Teenager, not knowing why
She was going to go into treatment to process this

The Fact that her Mother In Law wouldn't take her mom off the pickup list after telling her everything... She had to call the school. (Pickup list for her son)

Specifically calls out all the #Masciottas as the Traffickers who killed Steph's Dad and are now going after her. Steph believes the #Masciottas created all of this.`,

  'People/Ian Killeen.md': `Ian's Mom: [[Linda Gulli Killeen]]
Ian's Uncle: [[Roy Gulli Killeen]]

#nurse 

Ians patients "WRITE HIM LETTERS"
[[Nicholas Tedesco]] read that letter that was apparently from Steph... given to Nick by Ian???

![[SM_Ian_Killeen_Good_Samaritan_Hospital.png]]`,

  'People/Anthony Killeen.md': `#Killeen 
#nurse 
#medical

- Anthony Killeen is a nurse at [[Stony Brook Hospital]]- that is where [[Stephanie Mininni]] was brought for emergency psych. He has the ability to not only access her medical records but I am sure has some influence on those who provided her treatment. 
- Stephanie was not brought to Stony Brook from the police. They took her statement and stated they'll investigate. 
- Her mother called called the cops later that day with false accusations. Stephanie agreed to go bc she wanted to prove she was not on drugs. 
- Her toxicology report was clean at [[Stony Brook Hospital]]`,
};

/**
 * Get the actual markdown content for a given file path
 */
export function getMarkdownContent(relativePath: string): string | null {
  const content = markdownContentMap[relativePath];
  if (content) {
    console.log(`✅ Found real markdown content for ${relativePath}: ${content.length} characters`);
    return content;
  }
  
  console.warn(`⚠️ No markdown content found for ${relativePath}`);
  return null;
}

/**
 * Get all available file paths
 */
export function getAvailableFiles(): string[] {
  return Object.keys(markdownContentMap);
}

/**
 * Check if a file has real content available
 */
export function hasRealContent(relativePath: string): boolean {
  return relativePath in markdownContentMap;
}
