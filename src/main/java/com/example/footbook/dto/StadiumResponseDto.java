package com.example.footbook.dto;

import com.example.footbook.entity.Stadium;

public class StadiumResponseDto {

    private Long id;
    private String name;
    private String city;
    private String location;
    private Integer capacity;
    private Boolean available;

    public StadiumResponseDto() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public Boolean getAvailable() {
        return available;
    }

    public void setAvailable(Boolean available) {
        this.available = available;
    }

    public static StadiumResponseDto fromEntity(Stadium stadium) {
        StadiumResponseDto dto = new StadiumResponseDto();
        dto.setId(stadium.getId());
        dto.setName(stadium.getName());
        dto.setCity(stadium.getCity());
        dto.setLocation(stadium.getLocation());
        dto.setCapacity(stadium.getCapacity());
        dto.setAvailable(stadium.getAvailable());
        return dto;
    }
}
