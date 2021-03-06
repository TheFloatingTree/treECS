import { Entity } from './Entity';
import { Query } from  './Query';
import { uuidv4 } from './Util';

export class Scene {
    constructor() {
        this.id = uuidv4();
        this.systems = [];
        this.entities = [];
        this.queries = {};
        this.singletonComponents = new Entity();

        this.firstUpdate = true;
    }

    update(delta) {
        if (this.firstUpdate) this._init();
        this.systems.forEach(system => {
            system.update(delta);
        });
    }

    _init() {
        this._updateQueries();
        this.systems.forEach(system => {
            if (system.init) system.init();
        });
        this.firstUpdate = false;
    }

    registerSystem(System) {
        this.systems.push(new System(this, this.queries));
        return this;
    }

    registerQuery(name, ComponentArray) {
        if (name === "singleton") throw new Error("Singleton is a reserved query");
        this.queries[name] = new Query(name, ComponentArray);
        return this;
    }

    createEntity() {
        let newEntity = new Entity();
        this.entities.push(newEntity);
        this._updateQueries(); // I'd rather not iterate over every entity every time we add one.
        return newEntity;
    }

    removeEntity(entity) {
        this.entities = this.entities.filter(item => {
            return item.id !== entity.id;
        });
        this._updateQueries();
        return this;
    }

    addSingletonComponent(Component, initialState = {}) {
        // These are singleton so only one instance can exist in the singleton entity.
        if (this.singletonComponents.hasComponent(Component)) return;
        this.singletonComponents.addComponent(Component, initialState);
        this._updateQueries(); // I'd rather not iterate over every entity every time we add one.
        return this;
    }

    _updateQueries() {
        // TODO: This is terribly inefficient
        // Iterate over properties in the queries object
        for (const queryName in this.queries) {
            // Clear entities in each query
            this.queries[queryName].entities = [];
        }
        this.entities.forEach(entity => {
            for (const queryName in this.queries) {
                if (queryName === "singleton") continue; // This is kinda ugly
                const query = this.queries[queryName];
                if (query.match(entity)) {
                    query.entities.push(entity);
                }
            }
        });
        this.queries.singleton = this.singletonComponents;
    }
}