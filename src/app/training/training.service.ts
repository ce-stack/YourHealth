import { Subject } from 'rxjs/Subject';
import { Exercise } from './exercise.model';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';

@Injectable()
export class TrainingService {


    exerciseChanged = new Subject<Exercise>();
    exercisesChanged = new Subject<Exercise[]>();
    finishedExercisesChanged = new Subject<Exercise[]>();
    private availableExercises: Exercise[] = [];
    private runningExercise: Exercise;


    constructor(private db: AngularFirestore) {}
    fetchavailableExercise() {
        this.db
        .collection('availableExercises')
        .snapshotChanges()
        .pipe(
            map(docArray => {
         return docArray.map(doc => {
            return {
              id: doc.payload.doc.id,
                name: doc.payload.doc.data()['name'],
                duration: doc.payload.doc.data()['duration'],
                calories: doc.payload.doc.data()['calories'],
            };
          });
        }))
        .subscribe((exercises: Exercise[]) => {
            this.availableExercises = exercises;
            this.exercisesChanged.next([...this.availableExercises]);
        });
    }

    startExercise(selectedId: string) {
        this.runningExercise  = this.availableExercises.find(
        ex => ex.id === selectedId
        );
        this.exerciseChanged.next({ ...this.runningExercise });
    }

    completeExercise() {
        this.addDataToDatabase({...this.runningExercise , date: new Date() , state: 'completed'});
        this.runningExercise = null;
        this.exerciseChanged.next(null);
    }

    cancelExercise(progress: number) {
        this.addDataToDatabase({...this.runningExercise,
            duration: this.runningExercise.duration * (progress / 100),
            calories: this.runningExercise.duration * (progress / 100),
            date: new Date() ,
            state: 'canceled'});
        this.runningExercise = null;
        this.exerciseChanged.next(null);
    }

    getRunningExercise() {
        return { ...this.runningExercise };
    }

    fetchCompletedOrCanceledExercises() {
        this.db.collection('finishedExercise').valueChanges().subscribe((exercises: Exercise[]) => {
            this.finishedExercisesChanged.next(exercises);
        });
    }

    private addDataToDatabase(exercise: Exercise){
        this.db.collection('finishedExercise').add(exercise);
    }
}
