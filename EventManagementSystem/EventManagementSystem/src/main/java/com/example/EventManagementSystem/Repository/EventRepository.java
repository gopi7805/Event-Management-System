package com.example.EventManagementSystem.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.EventManagementSystem.Model.Events;

public interface EventRepository extends JpaRepository<Events, Integer> {

}
