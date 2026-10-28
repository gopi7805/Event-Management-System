package com.example.EventManagementSystem.Service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.EventManagementSystem.Model.Events;
import com.example.EventManagementSystem.Model.Bookings;
import com.example.EventManagementSystem.Repository.EventRepository;
import com.example.EventManagementSystem.Repository.BookingRepository;

@Service
public class EventBookService {

    private final EventRepository eventRepository;
    private final BookingRepository bookingRepository;

    public EventBookService(EventRepository eventRepository,
                            BookingRepository bookingRepository) {
        this.eventRepository = eventRepository;
        this.bookingRepository = bookingRepository;
    }

    // Get all events
    public List<Events> getAllEvents() {
        return eventRepository.findAll();
    }

    // Add one event
    public Events addEvent(Events event) {
        return eventRepository.save(event);
    }

    // Add multiple events
    public List<Events> addEvents(List<Events> events) {
        return eventRepository.saveAll(events);
    }

    // Update event
    public Events updateEvent(Integer id, Events event) {
        event.setEventId(id);
        return eventRepository.save(event);
    }

    // Delete event
    public void deleteEvent(Integer id) {
        eventRepository.deleteById(id);
    }

    // Get all bookings
    public List<Bookings> getAllBookings() {
        return bookingRepository.findAll();
    }

    // Add booking
    public Bookings addBooking(Bookings booking) {
        return bookingRepository.save(booking);
    }

}