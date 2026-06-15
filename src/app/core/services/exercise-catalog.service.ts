import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Test } from '../../models/app.models';
import { TestDataService } from './test-data.service';

export interface ExerciseCatalogItem {
  skill: Test['skill'];
  type: string;
  questionCount: number;
  testCount: number;
}

@Injectable({ providedIn: 'root' })
export class ExerciseCatalogService {
  constructor(private testDataService: TestDataService) {}

  getCatalog(skill?: Test['skill']): Observable<ExerciseCatalogItem[]> {
    return this.testDataService.getTests(skill ? { skill } : undefined).pipe(
      map((tests) => this.buildCatalog(tests))
    );
  }

  private buildCatalog(tests: Test[]): ExerciseCatalogItem[] {
    const summary = new Map<string, ExerciseCatalogItem & { testIds: Set<string> }>();

    for (const test of tests) {
      for (const part of test.parts) {
        for (const group of part.questionGroups ?? []) {
          const key = `${test.skill}::${group.type}`;
          const existing = summary.get(key) ?? {
            skill: test.skill,
            type: group.type,
            questionCount: 0,
            testCount: 0,
            testIds: new Set<string>()
          };

          existing.questionCount += group.questions.length;
          existing.testIds.add(test.id);
          existing.testCount = existing.testIds.size;
          summary.set(key, existing);
        }
      }
    }

    return [...summary.values()]
      .map(({ testIds, ...item }) => item)
      .sort((left, right) => {
        if (left.skill !== right.skill) {
          return left.skill.localeCompare(right.skill);
        }

        return right.questionCount - left.questionCount;
      });
  }
}
