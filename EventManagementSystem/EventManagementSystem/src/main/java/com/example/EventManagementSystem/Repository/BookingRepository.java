package com.example.EventManagementSystem.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.EventManagementSystem.Model.Bookings;

public interface BookingRepository extends JpaRepository<Bookings, Integer> {

}
