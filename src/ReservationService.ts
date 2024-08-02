import type { Repository } from "./Repository";

export class ReservationService {

    private repository: Repository;

    constructor(repository: Repository){
        this.repository = repository;
    }

    
    search() {
        this.repository.findTables({capacity: 6, datetime: new Date(), restrictionIds: []});
    }

    reserve() {
        
    }

    cancel() {
        
    }
}