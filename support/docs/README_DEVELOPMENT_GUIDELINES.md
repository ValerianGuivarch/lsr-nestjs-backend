# development guidelines

## table of content

- git workflow
- create a pull request
- creating a hotfix
- packages naming
- endpoints management
- entity, providers, services naming
- database collections naming
- api endpoints naming
- services and providers parameters regarding the marketplace/database
- code style

## git workflow

### main structure

There is 3 main branches :
- `main` : production release
- `staging` : staging release
- `develop` : development release

:warning: There should *never* be any direct commit to those branches, only merges.

At all times, there should be a working/shared branch called like `sprint*`. 
This branch is the only one where we accept direct commits.

### create a feature

For every new feature, a new branch called `feat/name-of-the-feature` has to be created.
Once the feature is ready for a pull request (see `create a pull request`), this branch will be merged into the working branch `sprint*`

Once the current sprint is delivered in production, those working `feat/***` branches should be deleted.

## create a pull request

Once you finished your feature on your `feat/***`, you are ready to send your pull request :

- update your branch `feat/***` from the shared `sprint` branch :
    - with a rebase (see a [tutorial](https://www.benmarshall.me/git-rebase/) if necessary)
    - or if you not enough familiar with git rebase, merge the `sprint` branch into your `feat/***`
- go to github, and start a new PR, with the branch `sprint` as the base
- fill out the PR description template :
    - description of your feature (your reviewer might not be aware of the context)
    - list of tests executed/added/ran : the goal is you explain your reviewer which type of tests you added/modified, what kind of manual/automated tests you ran before sending the PR
    - remaining problems, things to pay attention to : here you can warn your reviewer about some specific points you want him to watch during the review
- once your got your review approved, ask your reviewer who's in charge to merge your branch

> congratulations, you finished you first PR !

## creating a hotfix

if you have to create a hotfix (push a fix in production, but staging can't be sent to prod), there is a way :

- create a branch from `main` called `hotfix/name-of-fix`
- once done (pull request if necessary), merge your branch into `main`
- merge your branch `hotfix/name-of-fix` into the shared `sprint*` branch
- delete your hotfix branch


## code style

### api endpoints naming 

we enforce snake-case naming : `/public_profile` instead of `/publicProfile`


### default exports

do not use default exports like :

```typescript
export default class Entity {
}
import Entity from '../Entity'
```

in favor of named exports :

```typescript
export class Entity{}
import { Entity } from '../Entity'
```

This choice has been made to improve readability and consistency.

Read more here : https://basarat.gitbook.io/typescript/main-1/defaultisbad

### instantiate a new class

In order to respect the prototyping of the class you wish to instantiate and to be able to use named parameters for better readability, use a Partial entity describing the parameters in the constructor :

```typescript
export class Entity {
  id: string
  name: string

  constructor(p: Partial<Entity>) {
    this.id = p.id || ''
    this.name = p.name || ''
  }
}

const myEntity = new Entity({id: '', name: ''})
```

Same goes for function, as much as possible, for readability and reducing errors, use an object as a parameter :

```typescript
function findById(p: { foo: string, bar: number }): Promise<Entity> {
  return `${foo}${bar}`
}

const result = this.findById({ foo: 'hello', bar: 1 })
```

### functions naming for find operations

- If you expect to find an entity or `throw an exception` if not found, use `findOneById(): Entity`
- If you expect to find an entity or `undefined` if not found, use `findById(): Entity | undefined`

### eslint enforcing

A few rules are strictly enforced :
- `max-params` : not more than 4 parameters for a function, use an objet parameter if necessary (see above)
- `no-non-null-assertion` : prevent the use of `const test = objOrUndefined!`
- `explicit-module-boundary-types`: enforce all functions to return a type, and prevent the use of `any`
