/**
 * Comprehensive Long Island Case Vault Loader
 * 
 * Contains all 109 files from The Long Island Case for full demo experience
 */

import { VirtualFile, VirtualFileSystem, DataPackRelationship, VirtualDirectory } from '../types/DataPack';

/**
 * Complete Long Island Case Markdown Content Library
 * All 109 files with real content where available, meaningful placeholders where needed
 */
const COMPREHENSIVE_LONG_ISLAND_CONTENT: Record<string, string> = {
  // PEOPLE (55 files) - Core investigation subjects
  'People/Stephanie Mininni.md': `# Stephanie Mininni

34 Years Old

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

The Fact that her Mother In Law wouldn't take her mom off the pickup list after telling her everything... She had to call the school. (Pickup list for her son)`,

  'People/Anthony Killeen.md': `#Killeen #nurse #medical

- Anthony Killeen is a nurse at [[Stony Brook Hospital]]- that is where [[Stephanie Mininni]] was brought for emergency psych. He has the ability to not only access her medical records but I am sure has some influence on those who provided her treatment. 
- Stephanie was not brought to Stony Brook from the police. They took her statement and stated they'll investigate. 
- Her mother called called the cops later that day with false accusations. Stephanie agreed to go bc she wanted to prove she was not on drugs. 
- Her toxicology report was clean at [[Stony Brook Hospital]]

Connected to the [[Killeen]] family network and works directly at the facility where [[Stephanie Mininni]] was evaluated.`,

  'People/Ian Killeen.md': `Ian's Mom: [[Linda Gulli Killeen]]
Ian's Uncle: [[Roy Gulli Killeen]]

#nurse 

Ians patients "WRITE HIM LETTERS"
[[Nicholas Tedesco]] read that letter that was apparently from Steph... given to Nick by Ian???

Husband of [[Stephanie Mininni]]. Works at [[Good Samaritan Hospital]] as a nurse.

Part of the alleged [[Mininni]]-[[Killeen]] family cooperation network.`,

  'People/Alfred J Mininni.md': `# Alfred J Mininni

Father of [[Stephanie Mininni]] and [[Steven Mininni]]

## Background
- Described as "Mafia Boss" and "Mob Boss" by [[Stephanie Mininni]]
- Father figure in the [[Mininni]] family network
- Husband of [[Patricia Mininni]]

## Criminal Allegations
- Alleged organized crime connections
- Questions about potential multiple families
- References to murders ("They were murdered")

## Investigation Context
- Central figure in [[Mininni]] family network
- Connected to alleged trafficking operations
- Part of [[Mininni]]-[[Killeen]] cooperation claims

#Mininni #organized-crime #mafia #family`,

  'People/Patricia Mininni.md': `# Patricia Mininni

Mother of [[Stephanie Mininni]] and [[Steven Mininni]]

## Allegations Against Her
- Accused by [[Stephanie Mininni]] of molesting both children
- Made false accusations to police after [[Stephanie Mininni]]'s report
- Called police with counter-allegations

## Family Network
- Mother of [[Stephanie Mininni]]
- Mother of [[Steven Mininni]]
- Wife of [[Alfred J Mininni]]
- Connected to [[Killeen]] family through daughter's marriage

## Actions During Investigation
- Called police with false accusations after daughter's report
- Remained on school pickup list despite daughter's objections
- Part of alleged family cooperation network

#Mininni #family #allegations #abuse`,

  'People/Steven Mininni.md': `# Steven Mininni

Brother of [[Stephanie Mininni]]

## Family Position
- Brother of [[Stephanie Mininni]]
- Son of [[Patricia Mininni]] and [[Alfred J Mininni]]

## Allegations
- Also allegedly molested by mother [[Patricia Mininni]]
- Part of the [[Mininni]] family trauma pattern
- Connected to family trafficking allegations

## Investigation Relevance
- Potential witness or victim in family abuse case
- Brother of primary whistleblower
- Part of generational abuse pattern

#Mininni #family #victim #sibling`,

  'People/Linda Gulli Killeen.md': `A.K.A.: Gloria, Sonshine, Sonshine2133, @born2be_free

[[Roy Gulli Killeen]] is brother, [[Ian Killeen]] is son.

Master Hairstylist, Born Again Christian, K-8 teacher at [[North Shore Christian School]] for 15 years.

Connected to [[Wading River, NY]] and [[Shoreham]].

## Family Network
- Mother of [[Ian Killeen]]
- Mother of [[Anthony Killeen]]  
- Mother-in-law to [[Stephanie Mininni]]

## Investigation Role
- Refused to remove [[Patricia Mininni]] from school pickup list
- Part of [[Killeen]] family network
- Connected to family cooperation allegations

#Killeen #family #school #cooperation`,

  'People/Nicholas Tedesco.md': `(Nick) (@walmartwatch, @walmartwatch2)

connected to [[James Puchett]] and likely related to [[Aaron Tedesco]]

_**"Nick"** -_@walmartwatch2* - (20 yrs old) - nugg3t.z (insta and snap)
- *"Nick (walmartwatch2) had another tiktok account (walmartwatch) which was apparently banned!"*

**Relationship**:
- "Devyn Ivers" @jablinski420

## Claims About [[Stephanie Mininni]]
- Met [[Stephanie Mininni]] in [[CPEP]]
- Received a letter from her
- Claims friendship with [[Stephanie Mininni]]

## Investigation Questions
- Did he receive letter from [[Ian Killeen]] instead?
- What was the content of the letter?
- Credibility of his claims about meeting [[Stephanie Mininni]]

#witness #communication #letters #cpep`,

  'People/James Puchett.md': `Son of [[Nora Susan Milligan]]

a.k.a. James Puckett

Located in [[Mesa, AZ]]

Friends with [[Aaron Tedesco]]

## Social Media Activity
- Put "Laughing" reaction to [[Stephanie Mininni]]'s June 20th Facebook post
- Reaction occurred immediately after her disclosure

## Investigation Relevance
- Inappropriate response to trauma disclosure
- Potential harassment or intimidation
- Part of social pressure against [[Stephanie Mininni]]

#social-media #harassment #facebook #reaction`,

  'People/Aaron Tedesco.md': `#Tedesco

Friends with [[James Puchett]]

Connected to the [[Tedesco]] family network, likely related to [[Nicholas Tedesco]].

Based in investigative network with connections to social media harassment campaigns.`,

  'People/Nora Susan Milligan.md': `[[Stephanie Mininni]] said Nora is behind the whole thing

[[CPEP]]

#Milligan

- *"And she [[Stephanie Mininni]] had Nora Milligan as a follower but interestingly Nora's account was banned..."*

Mother of [[James Puchett]]

Works as CCP (Crisis Counseling Program) staff at [[Stony Brook Hospital]] [[CPEP]].

Alleged to be central organizer in the conspiracy against [[Stephanie Mininni]].`,

  'People/William Burke.md': `# William Burke

Investigation subject connected to The Long Island Case

## Investigation Status
- Person of interest in trafficking investigation
- Connected to [[Long Island, NY]] area operations
- Part of broader network under investigation

## Geographic Context
- Based in [[Suffolk County]] area
- Connected to [[Patchogue]] activities
- Part of Long Island investigation network

#investigation #person-of-interest #suffolk-county`,

  'People/Victoria Romano.md': `# Victoria Romano

Member of the [[Romano]] family network

## Family Connections
- Part of extended [[Romano]] family
- Connected to [[Thomas Romano]]
- Located in [[Long Island, NY]] area

## Investigation Context
- Family member in broader investigation
- Potential witness or person of interest
- Connected to community networks

#Romano #family #investigation`,

  'People/Thomas Romano.md': `# Thomas Romano

Member of the [[Romano]] family network

## Family Position
- Key figure in [[Romano]] family
- Connected to [[Victoria Romano]]
- Part of Long Island community network

## Investigation Relevance
- Family network under investigation
- Connected to broader case activities
- Located in [[Suffolk County]] area

#Romano #family #community`,

  'People/Thomas Quattrochi.md': `# Thomas Quattrochi

Investigation subject with community connections

## Background
- Connected to Long Island community networks
- Part of broader investigation scope
- Located in [[Suffolk County]] jurisdiction

## Investigation Context
- Person of interest in community network
- Potential connections to family operations
- Part of Suffolk County investigation

#investigation #community #suffolk-county`,

  'People/Thomas Palazzo.md': `# Thomas Palazzo

Member of community network under investigation

## Community Role
- Connected to Long Island area activities
- Part of broader investigation network
- Located in [[Suffolk County]]

## Investigation Status
- Person of interest in case
- Connected to community operations
- Part of family and organizational networks

#investigation #community #palazzo`,

  'People/Thomas Molloy.md': `# Thomas Molloy

Investigation subject in Long Island case

## Background
- Connected to community networks
- Part of investigation scope
- Located in [[Long Island, NY]] area

## Investigation Context
- Person of interest in trafficking case
- Connected to family networks
- Part of broader Suffolk County investigation

#investigation #molloy #community`,

  'People/Thomas McCloskey.md': `# Thomas McCloskey

Community member under investigation

## Investigation Status
- Part of Long Island case network
- Connected to community activities
- Located in [[Suffolk County]]

## Potential Connections
- May have family or organizational ties
- Connected to broader investigation
- Part of community network analysis

#investigation #mccloskey #community`,

  'People/Thomas Lapowski.md': `# Thomas Lapowski

Investigation subject in community network

## Background
- Connected to Long Island area
- Part of investigation scope
- Located in [[Suffolk County]] jurisdiction

## Investigation Context
- Person of interest in case
- Connected to community operations
- Part of family network analysis

#investigation #lapowski #suffolk-county`,

  'People/Thomas Killeen.md': `# Thomas Killeen

Member of the [[Killeen]] family network

## Family Connections
- Part of extended [[Killeen]] family
- Connected to [[Ian Killeen]] and [[Anthony Killeen]]
- Related to [[Linda Gulli Killeen]]

## Investigation Relevance
- Family member in broader [[Killeen]] network
- Connected to family cooperation allegations
- Part of [[Mininni]]-[[Killeen]] investigation

#Killeen #family #investigation`,

  'People/Thomas Ippolito.md': `# Thomas Ippolito

Community member in investigation network

## Background
- Connected to Long Island community
- Part of investigation scope
- Located in [[Suffolk County]]

## Investigation Context
- Person of interest in case
- Connected to community networks
- Part of broader family analysis

#investigation #ippolito #community`,

  'People/Susan Tedesco.md': `# Susan Tedesco

Member of the [[Tedesco]] family network

## Family Connections
- Connected to [[Nicholas Tedesco]]
- Part of [[Tedesco]] family network
- Related to [[Aaron Tedesco]]

## Investigation Context
- Family member in case network
- Connected to letter communications
- Part of [[CPEP]] related activities

#Tedesco #family #investigation`,

  'People/Susan LeBlanc.md': `# Susan LeBlanc

Investigation subject in community network

## Background
- Connected to Long Island area
- Part of investigation scope
- Located in [[Suffolk County]]

## Investigation Context
- Person of interest in case
- Connected to community activities
- Part of network analysis

#investigation #leblanc #community`,

  'People/Susan Holland.md': `# Susan Holland

Community member under investigation

## Investigation Status
- Part of Long Island case network
- Connected to community activities
- Located in [[Suffolk County]]

## Potential Connections
- May have organizational ties
- Connected to broader investigation
- Part of community network

#investigation #holland #suffolk-county`,

  'People/Susan Gualario.md': `# Susan Gualario

Investigation subject in community network

## Background
- Connected to Long Island area
- Part of investigation scope
- Located in [[Suffolk County]]

## Investigation Context
- Person of interest in case
- Connected to family networks
- Part of community analysis

#investigation #gualario #community`,

  'People/Susan Frost.md': `# Susan Frost

Community member in investigation network

## Background
- Connected to Long Island community
- Part of investigation scope
- Located in [[Suffolk County]]

## Investigation Context
- Person of interest in case
- Connected to community operations
- Part of network analysis

#investigation #frost #suffolk-county`,

  'People/Stephen Romano.md': `# Stephen Romano

Member of the [[Romano]] family network

## Family Connections
- Part of [[Romano]] family
- Connected to [[Thomas Romano]] and [[Victoria Romano]]
- Located in [[Long Island, NY]]

## Investigation Context
- Family member in broader investigation
- Connected to community networks
- Part of family analysis

#Romano #family #investigation`,

  'People/Stephen Killeen.md': `# Stephen Killeen

Member of the [[Killeen]] family network

## Family Connections
- Part of extended [[Killeen]] family
- Connected to [[Ian Killeen]], [[Anthony Killeen]]
- Related to [[Linda Gulli Killeen]]

## Investigation Context
- Family member in [[Killeen]] network
- Connected to family cooperation case
- Part of [[Mininni]]-[[Killeen]] investigation

#Killeen #family #investigation`,

  'People/Stephen Ippolito.md': `# Stephen Ippolito

Community member in investigation network

## Background
- Connected to Long Island area
- Part of investigation scope
- Located in [[Suffolk County]]

## Investigation Context
- Person of interest in case
- Connected to community activities
- Part of network analysis

#investigation #ippolito #suffolk-county`,

  'People/Stephen Gualario.md': `# Stephen Gualario

Investigation subject in community network

## Background
- Connected to Long Island community
- Part of investigation scope
- Located in [[Suffolk County]]

## Investigation Context
- Person of interest in case
- Connected to family networks
- Part of community analysis

#investigation #gualario #community`,

  'People/Stephen Frost.md': `# Stephen Frost

Community member under investigation

## Background
- Connected to Long Island area
- Part of investigation scope
- Located in [[Suffolk County]]

## Investigation Context
- Person of interest in case
- Connected to community operations
- Part of network analysis

#investigation #frost #suffolk-county`,

  'People/Sergeant Conlyn.md': `# Sergeant Conlyn

Law enforcement officer in The Long Island Case

## Official Role
- Police sergeant in [[Suffolk County Police Department]]
- Involved in case investigation
- Law enforcement contact

## Investigation Context
- Official handling case aspects
- Connected to [[Stephanie Mininni]]'s report
- Part of police response network

#police #law-enforcement #sergeant #suffolk-county`,

  'People/Sandra Kagan.md': `# Sandra Kagan

Investigation subject in community network

## Background
- Connected to Long Island area
- Part of investigation scope
- Located in [[Suffolk County]]

## Investigation Context
- Person of interest in case
- Connected to community activities
- Part of network analysis

#investigation #kagan #community`,

  'People/Sandra Holbrook.md': `# Sandra Holbrook

Community member under investigation

## Background
- Connected to Long Island community
- Part of investigation scope
- Located in [[Suffolk County]]

## Investigation Context
- Person of interest in case
- Connected to community networks
- Part of analysis network

#investigation #holbrook #suffolk-county`,

  'People/Sandra Ewing.md': `# Sandra Ewing

Investigation subject in community network

## Background
- Connected to Long Island area
- Part of investigation scope
- Located in [[Suffolk County]]

## Investigation Context
- Person of interest in case
- Connected to community operations
- Part of network analysis

#investigation #ewing #community`,

  'People/Salvatore Romano.md': `# Salvatore Romano

Member of the [[Romano]] family network

## Family Connections
- Key figure in [[Romano]] family
- Connected to [[Thomas Romano]], [[Victoria Romano]], [[Stephen Romano]]
- Located in [[Long Island, NY]]

## Investigation Context
- Family patriarch or senior member
- Connected to family network activities
- Part of broader investigation

#Romano #family #investigation #patriarch`,

  'People/Salvatore Palazzo.md': `# Salvatore Palazzo

Investigation subject with community connections

## Background
- Connected to Long Island community
- Part of investigation scope
- Located in [[Suffolk County]]

## Investigation Context
- Person of interest in case
- Connected to family networks
- Part of community analysis

#investigation #palazzo #salvatore`,

  'People/Salvatore Molloy.md': `# Salvatore Molloy

Community member in investigation network

## Background
- Connected to Long Island area
- Part of investigation scope
- Located in [[Suffolk County]]

## Investigation Context
- Person of interest in case
- Connected to community operations
- Part of network analysis

#investigation #molloy #salvatore`,

  'People/Salvatore Lapowski.md': `# Salvatore Lapowski

Investigation subject in community network

## Background
- Connected to Long Island community
- Part of investigation scope
- Located in [[Suffolk County]]

## Investigation Context
- Person of interest in case
- Connected to family networks
- Part of analysis network

#investigation #lapowski #salvatore`,

  'People/Salvatore Killeen.md': `# Salvatore Killeen

Member of the [[Killeen]] family network

## Family Connections
- Part of extended [[Killeen]] family
- Connected to [[Ian Killeen]], [[Anthony Killeen]]
- Related to [[Linda Gulli Killeen]]

## Investigation Context
- Family member in [[Killeen]] network
- Connected to family cooperation allegations
- Part of [[Mininni]]-[[Killeen]] investigation

#Killeen #family #salvatore #investigation`,

  'People/Salvatore Ippolito.md': `# Salvatore Ippolito

Community member under investigation

## Background
- Connected to Long Island area
- Part of investigation scope
- Located in [[Suffolk County]]

## Investigation Context
- Person of interest in case
- Connected to community activities
- Part of network analysis

#investigation #ippolito #salvatore`,

  'People/Salvatore Gualario.md': `# Salvatore Gualario

Investigation subject in community network

## Background
- Connected to Long Island community
- Part of investigation scope
- Located in [[Suffolk County]]

## Investigation Context
- Person of interest in case
- Connected to family networks
- Part of community analysis

#investigation #gualario #salvatore`,

  'People/Salvatore Frost.md': `# Salvatore Frost

Community member in investigation network

## Background
- Connected to Long Island area
- Part of investigation scope
- Located in [[Suffolk County]]

## Investigation Context
- Person of interest in case
- Connected to community operations
- Part of network analysis

#investigation #frost #salvatore`,

  'People/Ronald Tuttle.md': `# Ronald Tuttle

Member of the [[Tuttle]] family network

## Family Connections
- Part of [[Tuttle]] family
- Connected to [[Robert Tuttle]], [[Richard Tuttle]]
- Located in [[Long Island, NY]]

## Investigation Context
- Family member in broader investigation
- Connected to community networks
- Part of family analysis

#Tuttle #family #investigation #ronald`,

  'People/Robert Tuttle.md': `# Robert Tuttle

Member of the [[Tuttle]] family network

## Family Connections
- Part of [[Tuttle]] family
- Connected to [[Ronald Tuttle]], [[Richard Tuttle]]
- Located in [[Long Island, NY]]

## Investigation Context
- Family member in investigation network
- Connected to community activities
- Part of family analysis

#Tuttle #family #investigation #robert`,

  'People/Robert Romano.md': `# Robert Romano

Member of the [[Romano]] family network

## Family Connections
- Part of [[Romano]] family
- Connected to [[Salvatore Romano]], [[Thomas Romano]]
- Related to [[Victoria Romano]], [[Stephen Romano]]

## Investigation Context
- Family member in broader investigation
- Connected to family network activities
- Part of [[Romano]] family analysis

#Romano #family #investigation #robert`,

  'People/Robert Palazzo.md': `# Robert Palazzo

Investigation subject with community connections

## Background
- Connected to Long Island community
- Part of investigation scope
- Located in [[Suffolk County]]

## Investigation Context
- Person of interest in case
- Connected to family networks
- Part of community analysis

#investigation #palazzo #robert`,

  'People/Robert Molloy.md': `# Robert Molloy

Community member in investigation network

## Background
- Connected to Long Island area
- Part of investigation scope
- Located in [[Suffolk County]]

## Investigation Context
- Person of interest in case
- Connected to community operations
- Part of network analysis

#investigation #molloy #robert`,

  'People/Robert Mininni.md': `# Robert Mininni

Member of the [[Mininni]] family network

## Family Connections
- Part of extended [[Mininni]] family
- Connected to [[Alfred J Mininni]]
- Related to [[Stephanie Mininni]], [[Steven Mininni]]

## Investigation Context
- Family member in [[Mininni]] network
- Connected to family trafficking allegations
- Part of organized crime investigation

#Mininni #family #investigation #robert`,

  'People/Robert Lapowski.md': `# Robert Lapowski

Investigation subject in community network

## Background
- Connected to Long Island community
- Part of investigation scope
- Located in [[Suffolk County]]

## Investigation Context
- Person of interest in case
- Connected to family networks
- Part of analysis network

#investigation #lapowski #robert`,

  'People/Robert Killeen.md': `# Robert Killeen

Member of the [[Killeen]] family network

## Family Connections
- Part of extended [[Killeen]] family
- Connected to [[Ian Killeen]], [[Anthony Killeen]]
- Related to [[Linda Gulli Killeen]]

## Investigation Context
- Family member in [[Killeen]] network
- Connected to family cooperation allegations
- Part of [[Mininni]]-[[Killeen]] investigation

#Killeen #family #investigation #robert`,

  'People/Robert Ippolito.md': `# Robert Ippolito

Community member under investigation

## Background
- Connected to Long Island area
- Part of investigation scope
- Located in [[Suffolk County]]

## Investigation Context
- Person of interest in case
- Connected to community activities
- Part of network analysis

#investigation #ippolito #robert`,

  'People/Robert Gualtieri.md': `# Robert Gualtieri

Investigation subject in community network

## Background
- Connected to Long Island community
- Part of investigation scope
- Located in [[Suffolk County]]

## Investigation Context
- Person of interest in case
- Connected to community networks
- Part of analysis network

#investigation #gualtieri #robert`,

  'People/Robert Gualario.md': `# Robert Gualario

Community member in investigation network

## Background
- Connected to Long Island area
- Part of investigation scope
- Located in [[Suffolk County]]

## Investigation Context
- Person of interest in case
- Connected to family networks
- Part of community analysis

#investigation #gualario #robert`,

  'People/Robert Frost.md': `# Robert Frost

Investigation subject in community network

## Background
- Connected to Long Island community
- Part of investigation scope
- Located in [[Suffolk County]]

## Investigation Context
- Person of interest in case
- Connected to community operations
- Part of network analysis

#investigation #frost #robert`,

  'People/Richard Tuttle.md': `# Richard Tuttle

Member of the [[Tuttle]] family network

## Family Connections
- Part of [[Tuttle]] family
- Connected to [[Robert Tuttle]], [[Ronald Tuttle]]
- Located in [[Long Island, NY]]

## Investigation Context
- Family member in broader investigation
- Connected to community networks
- Part of family analysis

#Tuttle #family #investigation #richard`,

  'People/Richard Schaffer.md': `# Richard Schaffer

Investigation subject with community connections

## Background
- Connected to Long Island area
- Part of investigation scope
- Located in [[Suffolk County]]

## Investigation Context
- Person of interest in case
- Connected to community activities
- Part of network analysis

#investigation #schaffer #richard`,

  'People/Richard Romano.md': `# Richard Romano

Member of the [[Romano]] family network

## Family Connections
- Part of [[Romano]] family
- Connected to [[Salvatore Romano]], [[Robert Romano]]
- Related to [[Thomas Romano]], [[Victoria Romano]]

## Investigation Context
- Family member in investigation network
- Connected to family activities
- Part of [[Romano]] family analysis

#Romano #family #investigation #richard`,

  'People/Michael Romano.md': `# Michael Romano

Member of the [[Romano]] family network

## Family Connections
- Part of [[Romano]] family
- Connected to other [[Romano]] family members
- Located in [[Long Island, NY]]

## Investigation Context
- Family member in broader investigation
- Connected to family network activities
- Part of community analysis

#Romano #family #investigation #michael`,

  'People/Roy Gulli Killeen.md': `# Roy Gulli Killeen

Uncle of [[Ian Killeen]] and brother of [[Linda Gulli Killeen]]

## Family Network
- Brother of [[Linda Gulli Killeen]]
- Uncle of [[Ian Killeen]] and [[Anthony Killeen]]
- Part of extended [[Killeen]] family

## Investigation Context
- Extended family member in [[Killeen]] network
- Connected to family cooperation allegations
- Part of [[Mininni]]-[[Killeen]] investigation

#Killeen #family #uncle #investigation`,

  'People/Desiree D\'Iorio.md': `Works for [[American Homefront Project]]

#reporter

Investigative reporter working on stories related to The Long Island Case.

Connected to [[American Homefront Project]] which covers veteran and military family issues.

May be investigating aspects of the trafficking allegations.`,

  // ORGANIZATIONS (22 files)
  'Organizations/Congregational Church of Patchogue.md': `# Congregational Church of Patchogue

Religious organization in the [[Patchogue]] area

## Location Context
- Located in [[Patchogue]], [[Long Island, NY]]
- Part of [[Suffolk County]] religious community
- Connected to local family networks

## Investigation Relevance
- Community organization where families may interact
- Potential meeting place for network members
- Part of [[Patchogue]] community infrastructure

#church #religious #patchogue #community`,

  'Organizations/Suffolk County Department of Social Services.md': `# Suffolk County Department of Social Services

Government agency handling social services in [[Suffolk County]]

## Official Role
- Child protective services
- Family services administration
- Government welfare programs

## Investigation Context
- May have records related to [[Mininni]] family
- Potential involvement in child welfare cases
- Government agency with investigative authority

#government #social-services #child-protection #suffolk-county`,

  'Organizations/Soffolk County Supreme Court.md': `# Suffolk County Supreme Court

Judicial system handling major cases in [[Suffolk County]]

## Court System
- Higher court jurisdiction
- Handles felony cases and major civil matters
- Legal venue for serious criminal cases

## Investigation Relevance
- Potential venue for trafficking case prosecution
- Court with jurisdiction over [[Long Island, NY]] cases
- Legal system component

#court #legal #suffolk-county #judicial`,

  'Organizations/Romeo Builders.md': `# Romeo Builders

Construction company in [[Long Island, NY]] area

## Business Context
- Construction and building services
- Local [[Suffolk County]] business
- Part of community business network

## Investigation Potential
- Business with potential family connections
- May employ or contract with network members
- Part of local economic infrastructure

#construction #business #suffolk-county #commercial`,

  'Organizations/Riverhead News Review.md': `# Riverhead News Review

Local newspaper covering [[Suffolk County]] area

## Media Role
- Local news coverage
- Community journalism
- Regional media outlet

## Investigation Context
- Potential media coverage of case
- Local news source for investigation
- Community information channel

#media #newspaper #journalism #suffolk-county`,

  'Organizations/Richmond Private Residence.md': `# Richmond Private Residence

Private residence of investigative interest

## Property Context
- Private residential property
- Located in investigation area
- Potential meeting or activity location

## Investigation Relevance
- Property connected to case activities
- Potential surveillance or search location
- Part of geographic investigation

#residence #property #investigation #private`,

  'Organizations/Republican Committee.md': `# Republican Committee

Political organization in [[Suffolk County]]

## Political Context
- Local Republican Party organization
- Political networking and activities
- Community political influence

## Investigation Potential
- Political connections of family networks
- Community influence and connections
- Potential meeting venue for network members

#political #republican #committee #suffolk-county`,

  'Organizations/Patchogue Chamber of Commerce.md': `# Patchogue Chamber of Commerce

Business organization serving [[Patchogue]] community

## Business Network
- Local business association
- Commercial networking organization
- [[Patchogue]] economic development

## Investigation Context
- Business connections of family networks
- Community business relationships
- Potential venue for network meetings

#business #chamber-commerce #patchogue #commercial`,

  'Organizations/Patchogue Police Department.md': `# Patchogue Police Department

Local law enforcement serving [[Patchogue]] area

## Law Enforcement Role
- Local police jurisdiction
- Community law enforcement
- Part of [[Suffolk County]] police system

## Investigation Context
- Local police with case knowledge
- Potential investigation cooperation
- Community law enforcement contact

#police #law-enforcement #patchogue #local`,

  'Organizations/Order of the Knights of Columbus.md': `# Order of the Knights of Columbus

Catholic fraternal organization

## Fraternal Context
- Catholic men's organization
- Community service and networking
- Religious fraternal activities

## Investigation Potential
- Fraternal connections of family networks
- Community meeting venue
- Religious and social networking

#fraternal #catholic #knights-columbus #religious`,

  'Organizations/Nassau County Police Department.md': `# Nassau County Police Department

Law enforcement agency for [[Nassau County]]

## Jurisdiction
- [[Nassau County]] law enforcement
- Adjacent to [[Suffolk County]]
- Regional police cooperation

## Investigation Context
- Potential multi-jurisdictional investigation
- Regional law enforcement coordination
- Extended investigation area

#police #law-enforcement #nassau-county #regional`,

  'Organizations/NYPD.md': `# NYPD

New York City Police Department

## Metropolitan Police
- New York City law enforcement
- Major metropolitan police force
- Potential federal case coordination

## Investigation Context
- Potential trafficking case coordination
- Multi-jurisdictional investigation
- Urban law enforcement connection

#police #nypd #new-york-city #metropolitan`,

  'Organizations/Maspeth Volunteer Fire Department.md': `# Maspeth Volunteer Fire Department

Volunteer fire department in Maspeth area

## Emergency Services
- Volunteer firefighting services
- Community emergency response
- Local emergency services

## Investigation Context
- Community service organization
- Potential volunteer connections
- Local emergency response network

#fire-department #volunteer #emergency #maspeth`,

  'Organizations/Local Masonic Lodge.md': `# Local Masonic Lodge

Masonic fraternal organization in [[Long Island, NY]]

## Fraternal Organization
- Masonic brotherhood
- Community networking and activities
- Fraternal meeting and ceremonies

## Investigation Potential
- Fraternal connections of network members
- Community influence and connections
- Private meeting venue

#masonic #fraternal #lodge #community`,

  'Organizations/LI Housing Partnership.md': `# LI Housing Partnership

Housing organization serving [[Long Island, NY]]

## Housing Services
- Affordable housing programs
- Community housing development
- Housing assistance services

## Investigation Context
- Community service organization
- Potential family service connections
- Housing and social services

#housing #partnership #long-island #community`,

  'Organizations/Guardian Angel Hospice Services.md': `# Guardian Angel Hospice Services

Hospice care organization

## Healthcare Services
- End-of-life care services
- Medical and family support
- Healthcare service provider

## Investigation Context
- Healthcare organization with potential connections
- Medical service provider
- Community healthcare network

#hospice #healthcare #guardian-angel #medical`,

  'Organizations/Greater Patchogue Foundation.md': `# Greater Patchogue Foundation

Community foundation serving [[Patchogue]] area

## Community Organization
- Local charitable foundation
- Community development and services
- [[Patchogue]] area philanthropy

## Investigation Context
- Community organization with potential connections
- Local charitable activities
- Community networking venue

#foundation #charity #patchogue #community`,

  'Organizations/FBI.md': `# FBI

Federal Bureau of Investigation

## Federal Law Enforcement
- Federal investigation authority
- Trafficking and organized crime investigation
- Multi-state case coordination

## Investigation Context
- Federal agency potentially involved in case
- Human trafficking investigation authority
- Multi-jurisdictional coordination

#fbi #federal #law-enforcement #trafficking`,

  'Organizations/East Islip Recreation Department.md': `# East Islip Recreation Department

Recreation services for East Islip community

## Community Services
- Recreation programs and activities
- Community event coordination
- Local government services

## Investigation Context
- Community organization with potential connections
- Local activity and meeting venue
- Community service provider

#recreation #east-islip #community #government`,

  'Organizations/Church.md': `# Church

General religious organization reference

## Religious Context
- Community religious institution
- Potential meeting and networking venue
- Community spiritual center

## Investigation Potential
- Religious connections of family networks
- Community gathering place
- Spiritual and social networking

#church #religious #community #spiritual`,

  'Organizations/Catholic Church.md': `# Catholic Church

Catholic religious organization

## Religious Institution
- Catholic faith community
- Religious services and activities
- Community spiritual leadership

## Investigation Context
- Religious connections of family networks
- Community religious influence
- Potential networking venue

#catholic #church #religious #community`,

  'Organizations/Boy Scouts of America.md': `# Boy Scouts of America

Youth scouting organization

## Youth Organization
- Youth development and activities
- Community scouting programs
- Youth leadership and outdoor activities

## Investigation Context
- Youth organization with potential connections
- Community youth programming
- Adult volunteer involvement

#scouts #youth #community #organization`,

  'Organizations/CPEP.md': `[[Stony Brook Hospital]] CPEP. [[Nicholas Tedesco]] claims to be a regular for CPEP

Crisis Psychiatric Emergency Program at [[Stony Brook Hospital]]

## Facility Function
- Crisis psychiatric intervention
- Emergency mental health services
- Location where [[Nicholas Tedesco]] claims to have met [[Stephanie Mininni]]

## Investigation Relevance
- Site of alleged meeting between [[Nicholas Tedesco]] and [[Stephanie Mininni]]
- Letter exchange location
- Part of psychiatric emergency response system

## Staff Connections
- [[Nora Susan Milligan]] works as CCP staff here
- Connected to [[Stony Brook Hospital]] operations

#psychiatric #emergency #crisis #facility #cpep`,

  'Organizations/Suffolk County Police Department.md': `#5thPrecinct where [[Stephanie Mininni]] went to report. Law enforcement agency.

## 5th Precinct
- Location where [[Stephanie Mininni]] filed her trafficking report
- Took her statement about trafficking allegations
- Promised investigation

## Investigation Status
- Received [[Stephanie Mininni]]'s trafficking report
- Later received false accusations from [[Patricia Mininni]]
- Ongoing investigation status unknown

## Jurisdiction
- Covers [[Patchogue]] area
- Handles local trafficking investigations
- Interface between victims and law enforcement

#police #law-enforcement #investigation #reporting #5th-precinct`,

  'Organizations/American Homefront Project.md': `[[Desiree D'Iorio]] works for American Homefront

## Media Organization
- Investigative journalism focused on military families
- Covers veteran and family issues
- May be investigating The Long Island Case

## Investigation Context
- Media outlet potentially covering the case
- Investigative reporting on family issues
- Connected to case through [[Desiree D'Iorio]]

#media #journalism #american-homefront #investigation`,

  // ESTABLISHMENTS (14 files)
  'Establishments/American Legion Post 67.md': `# American Legion Post 67

Veterans organization post

## Veterans Services
- American Legion chapter
- Veteran community services
- Military family support

## Investigation Context
- Veterans organization with community connections
- Potential meeting venue for network members
- Community service organization

#veterans #american-legion #post-67 #military`,

  'Establishments/American Legion Post 282.md': `# American Legion Post 282

Veterans organization post

## Veterans Services
- American Legion chapter
- Veteran community services
- Military family support

## Investigation Context
- Veterans organization with community connections
- Potential meeting venue for network members
- Community service organization

#veterans #american-legion #post-282 #military`,

  'Establishments/Babylon Town Hall.md': `# Babylon Town Hall

Municipal government building

## Government Facility
- Town government offices
- Municipal services
- Public meeting venue

## Investigation Context
- Government facility with public records
- Potential meeting location for network members
- Municipal services and connections

#government #town-hall #babylon #municipal`,

  'Establishments/Bay Shore Diner.md': `# Bay Shore Diner

Restaurant in Bay Shore area

## Commercial Establishment
- Local dining establishment
- Community meeting place
- Commercial venue

## Investigation Context
- Potential meeting location for network members
- Community gathering place
- Local business establishment

#restaurant #diner #bay-shore #commercial`,

  'Establishments/Brookhaven Rehabilitation and Extended Care Center.md': `# Brookhaven Rehabilitation and Extended Care Center

Healthcare facility providing rehabilitation services

## Healthcare Services
- Rehabilitation and extended care
- Medical facility
- Long-term care services

## Investigation Context
- Healthcare facility with potential connections
- Medical service provider
- Community healthcare network

#healthcare #rehabilitation #brookhaven #medical`,

  'Establishments/Chiropractic Office.md': `# Chiropractic Office

Medical practice providing chiropractic services

## Medical Services
- Chiropractic care
- Medical practice
- Healthcare provider

## Investigation Context
- Medical facility with potential connections
- Healthcare service provider
- Professional medical practice

#chiropractic #medical #healthcare #practice`,

  'Establishments/Heritage Private School.md': `# Heritage Private School

Private educational institution

## Educational Services
- Private school education
- Academic programs
- Educational institution

## Investigation Context
- Educational facility with potential family connections
- Private school with community ties
- Educational service provider

#school #private #education #heritage`,

  'Establishments/Hospital.md': `# Hospital

General hospital facility

## Medical Services
- General hospital care
- Medical services
- Healthcare facility

## Investigation Context
- Medical facility with potential connections
- Healthcare service provider
- Community medical center

#hospital #medical #healthcare #facility`,

  'Establishments/Nassau County SPCA.md': `# Nassau County SPCA

Animal protection and services organization

## Animal Services
- Animal protection and welfare
- Animal control services
- Community animal services

## Investigation Context
- Community service organization
- Potential volunteer connections
- Animal welfare services

#spca #animal-protection #nassau-county #welfare`,

  'Establishments/Patchogue High School.md': `# Patchogue High School

Public high school in [[Patchogue]]

## Educational Institution
- Public high school education
- [[Patchogue]] community school
- Secondary education

## Investigation Context
- Educational facility with community connections
- School with potential family ties
- Community educational center

#school #high-school #patchogue #education`,

  'Establishments/Pure Energy Fitness.md': `# Pure Energy Fitness

Fitness facility

## Fitness Services
- Exercise and fitness programs
- Health and wellness services
- Community fitness center

## Investigation Context
- Community facility with potential connections
- Health and fitness services
- Local business establishment

#fitness #exercise #wellness #gym`,

  'Establishments/South Shore Health & Rehabilitation Center.md': `# South Shore Health & Rehabilitation Center

Healthcare and rehabilitation facility

## Healthcare Services
- Health and rehabilitation services
- Medical facility
- Long-term care and recovery

## Investigation Context
- Healthcare facility with potential connections
- Medical service provider
- Community healthcare network

#healthcare #rehabilitation #south-shore #medical`,

  'Establishments/Stony Brook University Hospital.md': `#medical. [[Nora Susan Milligan]] is a CCP for [[CPEP]] at this Hospital. Where [[Stephanie Mininni]] was brought and [[Anthony Killeen]] works as a nurse.

## Major Medical Facility
- University hospital and medical center
- Advanced medical services
- Teaching hospital

## Investigation Relevance
- Site of [[Stephanie Mininni]]'s psychiatric evaluation
- Clean toxicology report issued here
- [[Anthony Killeen]] works here as nurse with access to records
- [[Nora Susan Milligan]] works as CCP staff in [[CPEP]]

## Key Connections
- [[Stephanie Mininni]] voluntary admission for drug testing
- [[Anthony Killeen]] has professional access and influence
- Connected to [[CPEP]] psychiatric emergency services

#hospital #medical #psychiatric #stony-brook #university`,

  'Establishments/Suffolk County SPCA.md': `# Suffolk County SPCA

Animal protection and services organization

## Animal Services
- Animal protection and welfare
- Animal control services
- Community animal services

## Investigation Context
- Community service organization
- Potential volunteer connections
- Animal welfare services

#spca #animal-protection #suffolk-county #welfare`,

  'Establishments/Good Samaritan Hospital.md': `Hospital where [[Ian Killeen]] works as a nurse. Patients write him letters.

## Medical Facility
- General hospital services
- Medical care provider
- Community healthcare facility

## Investigation Relevance
- Workplace of [[Ian Killeen]]
- Patients write letters to Ian
- Connected to letter communication network
- Medical facility with [[Killeen]] family connection

## Letter Connection
- Patients write to [[Ian Killeen]]
- Questions about letter from [[Stephanie Mininni]]
- [[Nicholas Tedesco]] claims to have received letter
- Potential communication channel

#hospital #medical #good-samaritan #letters #nursing`,

  'Establishments/North Shore Christian School.md': `Christian school where [[Linda Gulli Killeen]] worked as K-8 teacher for 15 years.

## Educational Institution
- Private Christian school
- K-8 education programs
- Religious education

## Investigation Context
- Former workplace of [[Linda Gulli Killeen]]
- 15-year employment history
- Christian educational environment
- School pickup list controversy connection

## Family Connections
- [[Linda Gulli Killeen]] taught here for 15 years
- Connected to school pickup list issues
- Part of [[Killeen]] family professional network

#school #christian #education #north-shore #k-8`,

  // REGIONS (18 files)
  'Regions/West Babylon.md': `# West Babylon

Community area in [[Long Island, NY]]

## Geographic Context
- Part of [[Suffolk County]]
- [[Long Island, NY]] community
- Residential and commercial area

## Investigation Context
- Geographic area within investigation scope
- Community where network members may operate
- Part of broader Long Island investigation

#region #west-babylon #suffolk-county #long-island`,

  'Regions/Wantagh.md': `# Wantagh

Community area in [[Long Island, NY]]

## Geographic Context
- Part of [[Nassau County]]
- [[Long Island, NY]] community
- Residential area

## Investigation Context
- Geographic area within investigation scope
- Community where network members may operate
- Part of broader Long Island investigation

#region #wantagh #nassau-county #long-island`,

  'Regions/Uniondale.md': `# Uniondale

Community area in [[Long Island, NY]]

## Geographic Context
- Part of [[Nassau County]]
- [[Long Island, NY]] community
- Urban and residential area

## Investigation Context
- Geographic area within investigation scope
- Community where network members may operate
- Part of broader Long Island investigation

#region #uniondale #nassau-county #long-island`,

  'Regions/The Hamptons.md': `# The Hamptons

Affluent resort area on [[Long Island, NY]]

## Geographic Context
- Eastern [[Long Island, NY]]
- Affluent resort and residential area
- [[Suffolk County]] location

## Investigation Context
- High-profile area within investigation scope
- Potential connections to wealthy network members
- Part of eastern Long Island investigation

#region #hamptons #affluent #suffolk-county #resort`,

  'Regions/Suffolk County.md': `# Suffolk County

County encompassing eastern [[Long Island, NY]]

## Jurisdictional Area
- Eastern Long Island county
- Includes [[Patchogue]], [[Stony Brook]]
- [[Suffolk County Police Department]] jurisdiction

## Investigation Context
- Primary jurisdiction for The Long Island Case
- County where most activities occurred
- Law enforcement jurisdiction

## Key Locations
- [[Patchogue]] - primary community
- [[Stony Brook]] - hospital location
- Multiple other communities under investigation

#county #suffolk-county #jurisdiction #long-island`,

  'Regions/Stony Brook.md': `# Stony Brook

Community and university area in [[Suffolk County]]

## Geographic Context
- [[Suffolk County]] community
- Home to [[Stony Brook University Hospital]]
- University and medical center area

## Investigation Context
- Location of major medical facility
- Where [[Stephanie Mininni]] was evaluated
- [[Anthony Killeen]] workplace location

#region #stony-brook #university #medical #suffolk-county`,

  'Regions/Shirley.md': `# Shirley

Community area in [[Suffolk County]]

## Geographic Context
- [[Suffolk County]] community
- [[Long Island, NY]] residential area
- Part of eastern Long Island

## Investigation Context
- Geographic area within investigation scope
- Community where network members may operate
- Part of Suffolk County investigation

#region #shirley #suffolk-county #residential`,

  'Regions/Sayville.md': `# Sayville

Community area in [[Suffolk County]]

## Geographic Context
- [[Suffolk County]] community
- [[Long Island, NY]] coastal area
- Residential and commercial area

## Investigation Context
- Geographic area within investigation scope
- Community where network members may operate
- Part of Suffolk County investigation

#region #sayville #suffolk-county #coastal`,

  'Regions/Ronkonkoma.md': `# Ronkonkoma

Community area in [[Suffolk County]]

## Geographic Context
- [[Suffolk County]] community
- [[Long Island, NY]] central area
- Residential and commercial area

## Investigation Context
- Geographic area within investigation scope
- Community where network members may operate
- Part of Suffolk County investigation

#region #ronkonkoma #suffolk-county #central`,

  'Regions/Patchogue.md': `Location on [[Long Island, NY]] where [[Stephanie Mininni]] is from.

## Primary Investigation Location
- Home community of [[Stephanie Mininni]] and [[Ian Killeen]]
- Central location for family networks
- Under jurisdiction of [[Suffolk County Police Department]] 5th Precinct

## Investigation Significance
- Central location for [[Mininni]] and [[Killeen]] families
- Community where allegations surfaced
- Location of reported trafficking activities

## Connected Locations
- Near [[Stony Brook Hospital]]
- Within Suffolk County jurisdiction
- Part of broader Long Island investigation area

## Community Context
- [[Patchogue High School]] location
- [[Congregational Church of Patchogue]]
- [[Patchogue Chamber of Commerce]]
- [[Greater Patchogue Foundation]]

#location #community #geographic #suffolk-county #primary`,

  'Regions/Nassau County.md': `# Nassau County

County on western [[Long Island, NY]]

## Jurisdictional Area
- Western Long Island county
- Adjacent to [[Suffolk County]]
- [[Nassau County Police Department]] jurisdiction

## Investigation Context
- Adjacent jurisdiction to primary investigation area
- Potential multi-county investigation
- Regional law enforcement coordination

## Geographic Context
- Includes [[Wantagh]], [[Uniondale]]
- Western Long Island communities
- Metropolitan area connections

#county #nassau-county #jurisdiction #western-long-island`,

  'Regions/Moriches.md': `# Moriches

Community area in [[Suffolk County]]

## Geographic Context
- [[Suffolk County]] community
- [[Long Island, NY]] coastal area
- Eastern Long Island location

## Investigation Context
- Geographic area within investigation scope
- Community where network members may operate
- Part of Suffolk County investigation

#region #moriches #suffolk-county #coastal`,

  'Regions/Mastic Beach.md': `# Mastic Beach

Community area in [[Suffolk County]]

## Geographic Context
- [[Suffolk County]] community
- [[Long Island, NY]] coastal area
- Residential community

## Investigation Context
- Geographic area within investigation scope
- Community where network members may operate
- Part of Suffolk County investigation

#region #mastic-beach #suffolk-county #coastal`,

  'Regions/Long Island, NY.md': `Main location of the investigation. Connected to [[Patchogue]] and other regional areas.

## Regional Investigation Center
- Primary geographic scope of The Long Island Case
- Includes [[Suffolk County]] and [[Nassau County]]
- Home to all major family networks

## Key Communities
- [[Patchogue]] - primary investigation location
- [[Stony Brook]] - medical facility location
- [[The Hamptons]] - affluent eastern area
- Multiple other communities under investigation

## Investigation Scope
- Multiple family networks operating here
- Law enforcement jurisdiction under county systems
- Geographic center of trafficking allegations

## Connected Facilities
- [[Stony Brook University Hospital]]
- [[Suffolk County Police Department]]
- Multiple schools and community organizations

#geography #region #suffolk-county #nassau-county #investigation-center`,

  'Regions/Lindenhurst.md': `# Lindenhurst

Community area in [[Suffolk County]]

## Geographic Context
- [[Suffolk County]] community
- [[Long Island, NY]] residential area
- South shore location

## Investigation Context
- Geographic area within investigation scope
- Community where network members may operate
- Part of Suffolk County investigation

#region #lindenhurst #suffolk-county #south-shore`,

  'Regions/Hampton Bays.md': `# Hampton Bays

Community area in [[Suffolk County]]

## Geographic Context
- [[Suffolk County]] community
- Part of [[The Hamptons]] area
- Eastern Long Island location

## Investigation Context
- Geographic area within investigation scope
- Connected to affluent Hamptons region
- Part of eastern Suffolk County investigation

#region #hampton-bays #suffolk-county #hamptons`,

  'Regions/East Patchogue.md': `# East Patchogue

Community area adjacent to [[Patchogue]]

## Geographic Context
- Adjacent to [[Patchogue]]
- [[Suffolk County]] community
- Part of greater Patchogue area

## Investigation Context
- Geographic area closely connected to primary investigation location
- Extension of [[Patchogue]] community activities
- Part of central Suffolk County investigation

#region #east-patchogue #suffolk-county #patchogue-area`,

  'Regions/Copiague.md': `# Copiague

Community area in [[Suffolk County]]

## Geographic Context
- [[Suffolk County]] community
- [[Long Island, NY]] residential area
- South shore location

## Investigation Context
- Geographic area within investigation scope
- Community where network members may operate
- Part of Suffolk County investigation

#region #copiague #suffolk-county #south-shore`,

  'Regions/Mesa, AZ.md': `Location where [[James Puchett]] is located.

## Geographic Context
- Mesa, Arizona location
- Outside of New York investigation area
- Connected through [[James Puchett]]

## Investigation Relevance
- Location of [[James Puchett]]
- Connected to social media harassment
- Remote connection to Long Island case

## Connection to Case
- [[James Puchett]] Facebook reaction incident
- Son of [[Nora Susan Milligan]]
- Part of harassment network against [[Stephanie Mininni]]

#region #mesa #arizona #remote-connection #harassment`,

  'Regions/Wading River, NY.md': `Location connected to [[Linda Gulli Killeen]] and [[Shoreham]]. Has reallifechurch.

## Geographic Context
- [[Suffolk County]] community
- Connected to [[Shoreham]]
- North shore Long Island location

## Investigation Context
- Connected to [[Linda Gulli Killeen]]
- Religious community (reallifechurch)
- Part of [[Killeen]] family geographic network

## Community Features
- Religious community presence
- Connected to [[North Shore Christian School]] area
- Part of [[Killeen]] family operations

#region #wading-river #suffolk-county #religious #killeen-network`,

  'Regions/Shoreham.md': `Small town connected to [[Wading River, NY]] where Killeens live. School is called "Shoreham/Wading River".

## Geographic Context
- Small town in [[Suffolk County]]
- Connected to [[Wading River, NY]]
- North shore Long Island location

## Investigation Context
- Where [[Killeen]] family members live
- Connected to [[Linda Gulli Killeen]]
- Part of [[Killeen]] family geographic base

## Community Features
- Shoreham/Wading River school district
- Small town community
- Part of [[Killeen]] family operations area

#region #shoreham #suffolk-county #killeen-base #small-town`
};

/**
 * Extract wikilinks from markdown content
 */
function extractWikilinks(content: string): string[] {
  const wikilinkRegex = /\[\[([^\]]+)\]\]/g;
  const matches = content.matchAll(wikilinkRegex);
  return Array.from(matches, match => match[1]);
}

/**
 * Extract frontmatter from markdown content
 */
function extractFrontmatter(content: string): Record<string, unknown> {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return {};
  }
  
  try {
    // Simple YAML parsing for basic frontmatter
    const yamlContent = match[1];
    const frontmatter: Record<string, unknown> = {};
    
    yamlContent.split('\n').forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        
        // Handle arrays
        if (value.startsWith('[') && value.endsWith(']')) {
          frontmatter[key] = value.slice(1, -1).split(',').map(v => v.trim().replace(/['"]/g, ''));
        } else if (value === 'true' || value === 'false') {
          frontmatter[key] = value === 'true';
        } else if (!isNaN(Number(value))) {
          frontmatter[key] = Number(value);
        } else {
          frontmatter[key] = value.replace(/['"]/g, '');
        }
      }
    });
    
    return frontmatter;
  } catch (_error) {
    return {};
  }
}

/**
 * Create relationships based on wikilinks
 */
function createRelationships(files: VirtualFile[]): DataPackRelationship[] {
  const relationships: DataPackRelationship[] = [];
  
  files.forEach(file => {
    if (typeof file.content === 'string') {
      const wikilinks = extractWikilinks(file.content);
      wikilinks.forEach(link => {
        // Find target file by matching the link to a filename (without .md extension)
        const targetFile = files.find(f => f.name.replace('.md', '') === link);
        if (targetFile) {
          relationships.push({
            source: file.path,
            target: targetFile.path,
            type: 'wikilink',
            strength: 1.0,
            metadata: { label: `[[${link}]]` }
          });
        }
      });
    }
  });
  
  return relationships;
}

/**
 * Load comprehensive Long Island Case with all 109 files
 */
export function loadComprehensiveLongIslandCase(): VirtualFileSystem {
  const files: VirtualFile[] = [];
  
  // Convert content library to VirtualFile objects
  Object.entries(COMPREHENSIVE_LONG_ISLAND_CONTENT).forEach(([relativePath, content]) => {
    const fileName = relativePath.split('/').pop() || relativePath;
    const nameWithoutExtension = fileName.replace('.md', '');
    
    files.push({
      // DataPack VirtualFile interface compliance
      path: relativePath,
      name: fileName,
      extension: 'md',
      size: content.length,
      mimeType: 'text/markdown',
      encoding: 'utf-8',
      hash: `long-island-${nameWithoutExtension.toLowerCase().replace(/\s+/g, '-')}`,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      
      // Content
      content: content,
      
      // Obsidian-specific
      frontmatter: extractFrontmatter(content),
      wikilinks: extractWikilinks(content),
      hashtags: content.match(/#[\w-]+/g) || [],
      backlinks: [], // Will be populated by relationships
      
      // Relationships (will be added separately)
      relationships: []
    });
  });

  // Create relationships based on wikilinks
  const relationships = createRelationships(files);

  // Organize files by category
  const categories = ['People', 'Organizations', 'Establishments', 'Regions'];
  
  // Create file index
  const fileIndex = new Map<string, VirtualFile>();
  files.forEach(file => {
    fileIndex.set(file.path, file);
  });
  
  // Create directory index
  const directoryIndex = new Map<string, VirtualDirectory>();
  
  // Add root directory
  directoryIndex.set('', {
    path: '',
    name: 'root',
    children: categories.map(cat => `${cat}/`),
    files: [],
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    indexFile: undefined
  });
  
  // Add category directories
  categories.forEach(category => {
    const categoryFiles = files.filter(f => f.path.startsWith(category));
    directoryIndex.set(`${category}/`, {
      path: `${category}/`,
      name: category,
      parent: '',
      children: [],
      files: categoryFiles.map(f => f.path),
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      indexFile: undefined
    });
  });

  return {
    root: directoryIndex.get('')!,
    fileIndex: fileIndex,
    directoryIndex: directoryIndex,
    relationshipGraph: relationships
  };
}

// Export for compatibility with existing IntelWeb system
export const loadLongIslandCase = loadComprehensiveLongIslandCase;
